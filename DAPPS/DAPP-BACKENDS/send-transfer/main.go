package main

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
)

// ERC20 Transfer 函数签名: transfer(address,uint256)
var transferMethodID = crypto.Keccak256([]byte("transfer(address,uint256)"))[:4]

func main() {
	// 加载 .env 文件
	err := godotenv.Load()
	if err != nil {
		log.Fatal("加载 .env 文件失败:", err)
	}

	// 从 .env 读取配置
	sepoliaRPCURL := os.Getenv("SEPOLIA_RPC_URL")
	if sepoliaRPCURL == "" {
		infuraProjectID := os.Getenv("INFURA_PROJECT_ID")
		if infuraProjectID != "" {
			sepoliaRPCURL = fmt.Sprintf("https://sepolia.infura.io/v3/%s", infuraProjectID)
		} else {
			log.Fatal("请在 .env 文件中设置 SEPOLIA_RPC_URL 或 INFURA_PROJECT_ID")
		}
	}

	// 从 .env 读取私钥（移除 0x 前缀如果存在）
	privateKeyStr := os.Getenv("PRIVATE_KEY")
	if privateKeyStr == "" {
		log.Fatal("请在 .env 文件中设置 PRIVATE_KEY")
	}
	privateKeyStr = strings.TrimPrefix(privateKeyStr, "0x")

	// 从 .env 读取代币合约地址
	tokenAddressStr := os.Getenv("TOKEN_CONTRACT_ADDRESS")
	if tokenAddressStr == "" {
		// 如果没有设置，尝试使用 CONTRACT_ADDRESS（向后兼容）
		tokenAddressStr = os.Getenv("CONTRACT_ADDRESS")
		if tokenAddressStr == "" {
			log.Fatal("请在 .env 文件中设置 TOKEN_CONTRACT_ADDRESS 或 CONTRACT_ADDRESS")
		}
	}

	// 从 .env 读取接收方地址
	toAddressStr := os.Getenv("TO_ADDRESS")
	if toAddressStr == "" {
		log.Fatal("请在 .env 文件中设置 TO_ADDRESS（接收方地址）")
	}

	// 从 .env 读取转账金额（代币数量），如果没有设置则使用默认值 100
	amountStr := os.Getenv("TRANSFER_AMOUNT")
	if amountStr == "" {
		amountStr = "100"
		fmt.Println("ℹ未设置 TRANSFER_AMOUNT，使用默认值 100 代币")
	}

	// 从 .env 读取代币精度（可选，默认 18）
	decimalsStr := os.Getenv("TOKEN_DECIMALS")
	if decimalsStr == "" {
		decimalsStr = "18"
	}

	fmt.Println("开始代币转账...")
	fmt.Printf("RPC URL: %s\n", maskURL(sepoliaRPCURL))

	// 解析私钥
	privateKey, err := crypto.HexToECDSA(privateKeyStr)
	if err != nil {
		log.Fatal("私钥格式错误:", err)
	}

	// 从私钥获取地址
	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		log.Fatal("无法获取公钥")
	}

	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)
	tokenAddress := common.HexToAddress(tokenAddressStr)
	toAddress := common.HexToAddress(toAddressStr)

	fmt.Printf("发送方地址: %s\n", fromAddress.Hex())
	fmt.Printf("接收方地址: %s\n", toAddress.Hex())
	fmt.Printf("代币合约地址: %s\n", tokenAddress.Hex())
	fmt.Printf("转账金额: %s 代币\n\n", amountStr)

	// 连接到 Sepolia 网络
	client, err := ethclient.Dial(sepoliaRPCURL)
	if err != nil {
		log.Fatal("连接失败:", err)
	}
	defer client.Close()

	fmt.Println("连接成功!")

	ctx := context.Background()

	// 获取账户 ETH 余额（用于支付 Gas）
	ethBalance, err := client.BalanceAt(ctx, fromAddress, nil)
	if err != nil {
		log.Fatal("获取账户余额失败:", err)
	}

	fmt.Printf("ETH 余额: %s ETH\n", formatWeiToEther(ethBalance))

	// 获取代币余额
	tokenBalance, err := getTokenBalance(client, tokenAddress, fromAddress)
	if err != nil {
		log.Fatal("获取代币余额失败:", err)
	}

	decimals, _ := new(big.Int).SetString(decimalsStr, 10)
	fmt.Printf("代币余额: %s\n", formatTokenAmount(tokenBalance, decimals))

	// 解析转账金额（代币数量转最小单位）
	amount := parseTokenAmount(amountStr, decimals)
	fmt.Printf("转账金额: %s (最小单位)\n\n", amount.String())

	// 检查代币余额是否足够
	if tokenBalance.Cmp(amount) < 0 {
		log.Fatal("代币余额不足，无法完成转账")
	}

	// 获取链 ID
	chainID, err := client.NetworkID(ctx)
	if err != nil {
		log.Fatal("获取链 ID 失败:", err)
	}
	fmt.Printf("链 ID: %s\n", chainID.String())

	// 获取 nonce
	nonce, err := client.PendingNonceAt(ctx, fromAddress)
	if err != nil {
		log.Fatal("获取 nonce 失败:", err)
	}
	fmt.Printf("Nonce: %d\n", nonce)

	// 获取 Gas 价格
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		log.Fatal("获取 Gas 价格失败:", err)
	}
	fmt.Printf("Gas 价格: %s Gwei\n", formatWeiToGwei(gasPrice))

	// 构造代币转账的 data
	data := buildTransferData(toAddress, amount)

	// 估算 Gas 限制
	gasLimit, err := client.EstimateGas(ctx, ethereum.CallMsg{
		From:  fromAddress,
		To:    &tokenAddress,
		Value: big.NewInt(0),
		Data:  data,
	})
	if err != nil {
		// 如果估算失败，使用默认值（代币转账通常需要 65000-100000 Gas）
		gasLimit = 100000
		fmt.Printf("Gas 估算失败，使用默认值: %d\n", gasLimit)
	} else {
		// 增加 20% 的缓冲
		gasLimit = gasLimit + (gasLimit * 20 / 100)
		fmt.Printf("Gas 限制（估算）: %d\n", gasLimit)
	}

	// 计算总 Gas 费用
	totalGasCost := new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))
	fmt.Printf("预估 Gas 费用: %s ETH\n\n", formatWeiToEther(totalGasCost))

	// 检查 ETH 余额是否足够支付 Gas
	if ethBalance.Cmp(totalGasCost) < 0 {
		log.Fatal("ETH 余额不足支付 Gas 费用")
	}

	// 构造交易
	tx := types.NewTransaction(
		nonce,
		tokenAddress,  // 发送到代币合约地址
		big.NewInt(0), // 不发送 ETH，只调用合约函数
		gasLimit,
		gasPrice,
		data, // 包含 transfer 函数调用的 data
	)

	// 签名交易
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), privateKey)
	if err != nil {
		log.Fatal("签名交易失败:", err)
	}

	fmt.Println("交易已签名")

	// 发送交易
	err = client.SendTransaction(ctx, signedTx)
	if err != nil {
		log.Fatal("发送交易失败:", err)
	}

	// 获取交易哈希
	txHash := signedTx.Hash()
	fmt.Printf("\n交易已发送!\n")
	fmt.Printf("交易哈希: %s\n", txHash.Hex())
	fmt.Printf("Etherscan: https://sepolia.etherscan.io/tx/%s\n\n", txHash.Hex())

	// 等待交易确认
	fmt.Println("等待交易确认...")
	receipt, err := bind.WaitMined(ctx, client, signedTx)
	if err != nil {
		log.Fatal("等待交易确认失败:", err)
	}

	if receipt.Status == types.ReceiptStatusSuccessful {
		fmt.Println("交易已确认!")
		fmt.Printf("区块号: %d\n", receipt.BlockNumber.Uint64())
		fmt.Printf("Gas 使用量: %d\n", receipt.GasUsed)
		fmt.Printf("区块浏览器: https://sepolia.etherscan.io/block/%d\n", receipt.BlockNumber.Uint64())

		// 再次查询代币余额确认转账
		newTokenBalance, _ := getTokenBalance(client, tokenAddress, fromAddress)
		fmt.Printf("\n 转账后余额:\n")
		fmt.Printf("  发送方: %s\n", formatTokenAmount(newTokenBalance, decimals))

		toTokenBalance, _ := getTokenBalance(client, tokenAddress, toAddress)
		fmt.Printf("  接收方: %s\n", formatTokenAmount(toTokenBalance, decimals))
	} else {
		fmt.Println("交易失败!")
	}

	fmt.Println("\n 转账完成!")
}

// 构建 transfer 函数的调用数据
func buildTransferData(to common.Address, amount *big.Int) []byte {
	// transfer(address,uint256) 函数签名
	// 方法 ID (4 bytes) + to (32 bytes) + amount (32 bytes)
	data := make([]byte, 0, 68)

	// 添加方法 ID
	data = append(data, transferMethodID...)

	// 添加 to 地址（左填充到 32 字节）
	paddedTo := common.LeftPadBytes(to.Bytes(), 32)
	data = append(data, paddedTo...)

	// 添加 amount（左填充到 32 字节）
	paddedAmount := common.LeftPadBytes(amount.Bytes(), 32)
	data = append(data, paddedAmount...)

	return data
}

// 获取代币余额
func getTokenBalance(client *ethclient.Client, tokenAddress, accountAddress common.Address) (*big.Int, error) {
	// balanceOf(address) 函数签名
	balanceOfMethodID := crypto.Keccak256([]byte("balanceOf(address)"))[:4]

	// 构造调用数据
	data := make([]byte, 0, 36)
	data = append(data, balanceOfMethodID...)
	paddedAddress := common.LeftPadBytes(accountAddress.Bytes(), 32)
	data = append(data, paddedAddress...)

	// 调用合约
	result, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &tokenAddress,
		Data: data,
	}, nil)

	if err != nil {
		return nil, err
	}

	// 解析返回值（uint256）
	balance := new(big.Int).SetBytes(result)
	return balance, nil
}

// 解析代币金额（代币数量转最小单位）
func parseTokenAmount(amountStr string, decimals *big.Int) *big.Int {
	amountFloat := new(big.Float)
	amountFloat.SetString(amountStr)

	// 转换为最小单位
	multiplier := new(big.Float).SetInt(new(big.Int).Exp(big.NewInt(10), decimals, nil))
	amountInSmallestUnit := new(big.Float).Mul(amountFloat, multiplier)

	// 转换为 big.Int
	amountInt, _ := amountInSmallestUnit.Int(nil)
	return amountInt
}

// 格式化代币金额
func formatTokenAmount(amount *big.Int, decimals *big.Int) string {
	amountFloat := new(big.Float).SetInt(amount)
	divisor := new(big.Float).SetInt(new(big.Int).Exp(big.NewInt(10), decimals, nil))
	formatted := new(big.Float).Quo(amountFloat, divisor)
	return formatted.Text('f', int(decimals.Int64()))
}

// 格式化 Wei 到 Ether
func formatWeiToEther(wei *big.Int) string {
	ether := new(big.Float).Quo(new(big.Float).SetInt(wei), big.NewFloat(1e18))
	return ether.Text('f', 6)
}

// 格式化 Wei 到 Gwei
func formatWeiToGwei(wei *big.Int) string {
	gwei := new(big.Float).Quo(new(big.Float).SetInt(wei), big.NewFloat(1e9))
	return gwei.Text('f', 2)
}

// 掩码 URL（隐藏敏感信息）
func maskURL(url string) string {
	if len(url) > 50 {
		return url[:30] + "..." + url[len(url)-10:]
	}
	return url
}
