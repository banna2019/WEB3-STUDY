package main

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"

	// 导入生成的合约绑定
	"github.com/go-trasaction-contract/counter"
)

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

	contractAddressStr := os.Getenv("COUNTER_CONTRACT_ADDRESS")
	if contractAddressStr == "" {
		// 如果没有设置，尝试使用 CONTRACT_ADDRESS（向后兼容）
		contractAddressStr = os.Getenv("CONTRACT_ADDRESS")
		if contractAddressStr == "" {
			log.Fatal("请在 .env 文件中设置 COUNTER_CONTRACT_ADDRESS 或 CONTRACT_ADDRESS")
		}
	}

	privateKeyStr := os.Getenv("PRIVATE_KEY")
	if privateKeyStr == "" {
		log.Fatal("请在 .env 文件中设置 PRIVATE_KEY")
	}

	fmt.Println("连接到计数器合约...")
	fmt.Printf("RPC URL: %s\n", maskURL(sepoliaRPCURL))
	fmt.Printf("合约地址: %s\n", contractAddressStr)

	// 连接到网络
	client, err := ethclient.Dial(sepoliaRPCURL)
	if err != nil {
		log.Fatal("连接失败:", err)
	}
	defer client.Close()

	fmt.Println("连接成功!")

	ctx := context.Background()
	contractAddress := common.HexToAddress(contractAddressStr)

	// 创建合约实例（使用生成的 Counter 类型）
	counterInstance, err := counter.NewCounter(contractAddress, client)
	if err != nil {
		log.Fatal("创建合约实例失败:", err)
	}

	// 解析私钥并创建认证器
	privateKey, err := crypto.HexToECDSA(strings.TrimPrefix(privateKeyStr, "0x"))
	if err != nil {
		log.Fatal("私钥格式错误:", err)
	}

	chainID, err := client.NetworkID(ctx)
	if err != nil {
		log.Fatal("获取链 ID 失败:", err)
	}

	auth, err := bind.NewKeyedTransactorWithChainID(privateKey, chainID)
	if err != nil {
		log.Fatal("创建认证器失败:", err)
	}

	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		log.Fatal("获取 Gas 价格失败:", err)
	}
	auth.GasPrice = gasPrice
	auth.GasLimit = 300000

	// 获取初始 nonce
	nonce, err := client.PendingNonceAt(ctx, auth.From)
	if err != nil {
		log.Fatal("获取 nonce 失败:", err)
	}
	auth.Nonce = new(big.Int).SetUint64(nonce)

	fmt.Printf("Gas 价格: %s Gwei\n", formatWeiToGwei(gasPrice))
	fmt.Printf("Gas 限制: %d\n", auth.GasLimit)
	fmt.Printf("初始 Nonce: %d\n\n", nonce)

	// 执行操作流程
	fmt.Println("═══════════════════════════════════════════════════════")
	fmt.Println("开始执行计数器操作流程")
	fmt.Println("═══════════════════════════════════════════════════════")
	fmt.Println()

	// 1. 查看初始计数器值
	fmt.Println("步骤 1: 查看初始计数器值")
	displayCount(counterInstance, ctx)
	fmt.Println()

	// 2. 进行 3 次 increment 操作
	fmt.Println("步骤 2: 执行 3 次 increment 操作")
	for i := 1; i <= 3; i++ {
		fmt.Printf("  [%d/3] 执行 increment...\n", i)
		tx, err := counterInstance.Increment(auth)
		if err != nil {
			log.Fatalf("调用 increment 失败: %v", err)
		}

		receipt, err := waitForTransaction(ctx, client, tx, fmt.Sprintf("increment #%d", i))
		if err != nil {
			log.Fatalf("等待交易确认失败: %v", err)
		}

		if receipt.Status != types.ReceiptStatusSuccessful {
			log.Fatal("交易失败!")
		}

		// 更新 nonce 以便下次交易
		updateNonce(ctx, client, auth)
	}
	fmt.Println()

	// 3. 进行 1 次 decrement 操作
	fmt.Println("步骤 3: 执行 1 次 decrement 操作")
	fmt.Println("  执行 decrement...")
	tx, err := counterInstance.Decrement(auth)
	if err != nil {
		log.Fatalf("调用 decrement 失败: %v", err)
	}

	receipt, err := waitForTransaction(ctx, client, tx, "decrement")
	if err != nil {
		log.Fatalf("等待交易确认失败: %v", err)
	}

	if receipt.Status != types.ReceiptStatusSuccessful {
		log.Fatal("交易失败!")
	}

	// 更新 nonce 以便下次交易
	updateNonce(ctx, client, auth)
	fmt.Println()

	// 4. 查看当前计数器值
	fmt.Println("步骤 4: 查看当前计数器值")
	displayCount(counterInstance, ctx)
	fmt.Println()

	// 5. 调用 reset 方法
	fmt.Println("步骤 5: 执行 reset 操作")
	fmt.Println("  执行 reset...")
	tx, err = counterInstance.Reset(auth)
	if err != nil {
		log.Fatalf("调用 reset 失败: %v", err)
	}

	receipt, err = waitForTransaction(ctx, client, tx, "reset")
	if err != nil {
		log.Fatalf("等待交易确认失败: %v", err)
	}

	if receipt.Status != types.ReceiptStatusSuccessful {
		log.Fatal("交易失败!")
	}

	// 更新 nonce 以便下次交易
	updateNonce(ctx, client, auth)
	fmt.Println()

	// 6. 再次查看计数器值
	fmt.Println("步骤 6: 再次查看计数器值")
	displayCount(counterInstance, ctx)

	fmt.Println("\n═══════════════════════════════════════════════════════")
	fmt.Println("所有操作完成!")
	fmt.Println("═══════════════════════════════════════════════════════")
}

// 封装 getCount 方法，方便反复调用
func getCount(counterInstance *counter.Counter, ctx context.Context) (*big.Int, error) {
	return counterInstance.GetCount(&bind.CallOpts{Context: ctx})
}

// 显示计数器值
func displayCount(counterInstance *counter.Counter, ctx context.Context) {
	count, err := getCount(counterInstance, ctx)
	if err != nil {
		log.Fatalf("读取计数器值失败: %v", err)
	}
	fmt.Printf("  当前计数器值: %s\n", count.String())
}

// 更新 nonce
func updateNonce(ctx context.Context, client *ethclient.Client, auth *bind.TransactOpts) {
	nonce, err := client.PendingNonceAt(ctx, auth.From)
	if err == nil {
		auth.Nonce = new(big.Int).SetUint64(nonce)
	}
}

// 等待交易确认并显示结果
func waitForTransaction(ctx context.Context, client *ethclient.Client, tx *types.Transaction, operation string) (*types.Receipt, error) {
	fmt.Printf("    交易哈希: %s\n", tx.Hash().Hex())
	fmt.Printf("    等待确认...")

	receipt, err := bind.WaitMined(ctx, client, tx)
	if err != nil {
		return nil, err
	}

	if receipt.Status == types.ReceiptStatusSuccessful {
		fmt.Printf(" ✓\n")
		fmt.Printf("    区块号: %d, Gas 使用: %d\n", receipt.BlockNumber.Uint64(), receipt.GasUsed)
	} else {
		fmt.Printf(" ✗\n")
		fmt.Println("    交易失败!")
	}

	return receipt, nil
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
