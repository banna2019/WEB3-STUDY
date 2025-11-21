package main

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"os"
	"strconv"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
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
		// 如果没有 SEPOLIA_RPC_URL，尝试使用 INFURA_PROJECT_ID 构建
		infuraProjectID := os.Getenv("INFURA_PROJECT_ID")
		if infuraProjectID != "" {
			sepoliaRPCURL = fmt.Sprintf("https://sepolia.infura.io/v3/%s", infuraProjectID)
		} else {
			log.Fatal("请在 .env 文件中设置 SEPOLIA_RPC_URL 或 INFURA_PROJECT_ID")
		}
	}

	fmt.Println("开始连接到 Sepolia 测试网络...")
	fmt.Printf("RPC URL: %s\n", maskURL(sepoliaRPCURL))

	// 连接到 Sepolia 网络
	client, err := ethclient.Dial(sepoliaRPCURL)
	if err != nil {
		log.Fatal("连接失败:", err)
	}
	defer client.Close()

	fmt.Println("连接成功!")

	// 从 .env 读取要查询的区块号
	blockNumberStr := os.Getenv("BLOCK_NUMBER")
	var blockNumber *big.Int
	var blockNumberSource string

	if blockNumberStr != "" {
		// 如果设置了 BLOCK_NUMBER，使用它
		blockNum, err := strconv.ParseInt(blockNumberStr, 10, 64)
		if err != nil {
			log.Fatal("区块号格式错误:", err)
		}
		blockNumber = big.NewInt(blockNum)
		blockNumberSource = ".env 文件中的 BLOCK_NUMBER"
	} else {
		// 如果未设置 BLOCK_NUMBER，查询最新区块
		ctx := context.Background()
		latestBlock, err := client.BlockNumber(ctx)
		if err != nil {
			log.Fatal("获取最新区块号失败:", err)
		}
		blockNumber = big.NewInt(int64(latestBlock))
		blockNumberSource = "最新区块（未设置 BLOCK_NUMBER）"
		fmt.Println("未设置 BLOCK_NUMBER，将查询最新区块")
	}

	fmt.Printf("查询区块号: %s (%s)\n\n", blockNumber.String(), blockNumberSource)

	// 查询区块信息
	ctx := context.Background()
	block, err := client.BlockByNumber(ctx, blockNumber)
	if err != nil {
		log.Fatal("查询区块失败:", err)
	}

	// 输出区块信息
	fmt.Println("═════════════════════ 区块信息 ══════════════════════════")
	fmt.Printf("区块号 (Number):        %s\n", block.Number().String())
	fmt.Printf("区块哈希 (Hash):        %s\n", block.Hash().Hex())
	fmt.Printf("父区块哈希 (ParentHash): %s\n", block.ParentHash().Hex())
	fmt.Printf("时间戳 (Timestamp):     %d\n", block.Time())
	fmt.Printf("时间 (UTC):             %s\n", time.Unix(int64(block.Time()), 0).UTC().Format("2006-01-02 15:04:05 UTC"))
	fmt.Printf("交易数量 (TxCount):     %d\n", len(block.Transactions()))
	fmt.Printf("Gas 限制 (GasLimit):    %d\n", block.GasLimit())
	fmt.Printf("Gas 使用量 (GasUsed):   %d\n", block.GasUsed())
	fmt.Printf("难度 (Difficulty):      %s\n", block.Difficulty().String())
	fmt.Printf("矿工地址 (Miner):       %s\n", block.Coinbase().Hex())
	fmt.Printf("根哈希 (Root):          %s\n", block.Root().Hex())
	fmt.Printf("交易根 (TxHash):        %s\n", block.TxHash().Hex())
	fmt.Printf("收据根 (ReceiptHash):   %s\n", block.ReceiptHash().Hex())
	fmt.Printf("状态根 (StateRoot):     %s\n", block.Root().Hex())
	fmt.Printf("日志布隆 (Bloom):        %s\n", fmt.Sprintf("%x", block.Bloom().Bytes()))
	fmt.Printf("额外数据长度 (Extra):    %d bytes\n", len(block.Extra()))
	fmt.Println("═══════════════════════════════════════════════════════")

	// 如果有交易，显示前几条交易信息
	if len(block.Transactions()) > 0 {
		displayCount := 3
		if len(block.Transactions()) < displayCount {
			displayCount = len(block.Transactions())
		}

		fmt.Printf("\n交易列表 (显示前 %d 条，共 %d 条):\n", displayCount, len(block.Transactions()))
		fmt.Println("───────────────────────────────────────────────────")

		for i := 0; i < displayCount; i++ {
			tx := block.Transactions()[i]
			fmt.Printf("\n交易 #%d:\n", i+1)
			fmt.Printf("  交易哈希: %s\n", tx.Hash().Hex())

			// 获取发送方地址
			if sender, err := client.TransactionSender(ctx, tx, block.Hash(), uint(i)); err == nil {
				fmt.Printf("  发送方:   %s\n", sender.Hex())
			} else {
				fmt.Printf("  发送方:   无法解析 (%v)\n", err)
			}

			if tx.To() != nil {
				fmt.Printf("  接收方:   %s\n", tx.To().Hex())
			} else {
				fmt.Printf("  接收方:   合约创建\n")
			}

			fmt.Printf("  金额:     %s ETH\n", formatWeiToEther(tx.Value()))
			fmt.Printf("  Gas 价格: %s Gwei\n", formatWeiToGwei(tx.GasPrice()))
			fmt.Printf("  Gas 限制: %d\n", tx.Gas())
			fmt.Printf("  随机数:   %d\n", tx.Nonce())
		}

		if len(block.Transactions()) > displayCount {
			fmt.Printf("\n... 还有 %d 条交易未显示\n", len(block.Transactions())-displayCount)
		}
	} else {
		fmt.Println("\n该区块没有交易")
	}

	fmt.Println("\n查询完成!")
}

// 格式化 Wei 到 Ether
func formatWeiToEther(wei *big.Int) string {
	ether := new(big.Float).Quo(new(big.Float).SetInt(wei), big.NewFloat(1e18))
	return ether.Text('f', 18)
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
