## Go智能合约交互项目

这是一个使用`Go`语言与以太坊智能合约交互的示例项目.项目演示了如何通过 `abigen` 生成的`Go`绑定代码与部署在`Sepolia`测试网络上的 `SimpleCounter` 合约进行交互.



### 一、项目概述

**本项目实现了以下功能:**

- 连接到 Sepolia 测试网络
- 使用 `abigen` 生成的 Go 绑定代码与智能合约交互
- 执行合约方法调用(increment、decrement、reset、getCount)
- 管理交易 nonce 和 Gas 费用
- 等待交易确认并显示结果



### 二、项目结构

```bash
go-trasaction-contract/
├── main.go                    # 主程序文件
├── counter/                   # abigen 生成的合约绑定代码
│   └── counter.go
├── SimpleCounter.sol          # Solidity 合约源码
├── SimpleCounter_sol_SimpleCounter.abi  # 合约 ABI 文件
├── go.mod                     # Go 模块依赖
├── go.sum                     # 依赖校验和
└── README.md                  # 项目文档
```



### 三、项目配置

- **1.Go 环境**: Go 1.25.1或更高版本
- **2.以太坊账户**: 一个`Sepolia`测试网络的账户和私钥
- **3.RPC 节点**: `Sepolia`测试网络的`RPC`端点(`Infura`或`Alchemy`)
- **4.已部署的合约**: 在 Sepolia 网络上部署的 `SimpleCounter` 合约地址



#### 3.1.环境配置

在项目根目录创建 `.env` 文件,配置以下变量：

```env
# Sepolia RPC URL(二选一)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
# 或使用 Infura Project ID
INFURA_PROJECT_ID=your_infura_project_id

# 合约地址
COUNTER_CONTRACT_ADDRESS=0x...
# 或使用 CONTRACT_ADDRESS(向后兼容)
CONTRACT_ADDRESS=0x...

# 账户私钥(用于签名交易)
PRIVATE_KEY=your_private_key_without_0x_prefix
```



#### 3.2.执行操作

- 安装依赖

```bash
go mod download
```



- 生成`Go`绑定代码

> **如果还没有生成绑定代码,可以使用 `abigen` 工具**

```bash
# 安装 abigen
go install github.com/ethereum/go-ethereum/cmd/abigen@latest

# 生成 Go 绑定代码
abigen --abi SimpleCounter_sol_SimpleCounter.abi --pkg counter --type Counter --out counter/counter.go
```



- **运行程序**

```bash
go run main.go
```





### 四、功能说明

#### 执行流程

程序会按以下顺序执行操作：

1. **查看初始计数器值**: 调用 `getCount()` 获取当前计数值
2. **执行 3 次递增操作**: 循环调用 `increment()` 方法 3 次
3. **执行 1 次递减操作**: 调用 `decrement()` 方法 1 次
4. **查看当前计数器值**: 再次调用 `getCount()` 查看更新后的值
5. **重置计数器**: 调用 `reset()` 方法将计数器重置为 0
6. **查看最终计数器值**: 最后一次调用 `getCount()` 确认重置成功



##### 预期结果

```
初始值: 0
→ 3次 increment: 0 → 1 → 2 → 3
→ 1次 decrement: 3 → 2
→ 查看值: 2
→ reset: 2 → 0
→ 查看值: 0
```



### 五、核心功能实现

#### 1.合约连接

```go
// 连接到 Sepolia 网络
client, err := ethclient.Dial(sepoliaRPCURL)

// 创建合约实例
counterInstance, err := counter.NewCounter(contractAddress, client)
```



#### 2.交易签名

```go
// 从私钥创建账户
privateKey, _ := crypto.HexToECDSA(privateKeyStr)
auth, _ := bind.NewKeyedTransactorWithChainID(privateKey, chainID)
```



#### 3.`Nonce`管理

> **每次交易后自动更新`nonce`,确保交易顺序正确**

```go
func updateNonce(ctx context.Context, client *ethclient.Client, auth *bind.TransactOpts) {
    nonce, err := client.PendingNonceAt(ctx, auth.From)
    if err == nil {
        auth.Nonce = new(big.Int).SetUint64(nonce)
    }
}
```



#### 4.交易确认

> **使用 `bind.WaitMined` 等待交易被挖矿确认**

```go
receipt, err := bind.WaitMined(ctx, client, tx)
```





### 六、代码优化总结

#### 1.封装`getCount`方法

- **创建了 `getCount()` 函数**: 封装获取计数器值的逻辑,方便重复调用
- **创建了 `displayCount()` 函数**: 统一显示计数器值的格式,提供更好的用户体验

```go
// 封装 getCount 方法,方便反复调用
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
```



#### 2.实现完整的操作流程

**按照用户需求实现了完整的操作序列:**

- **步骤 1**: 查看初始计数器值
- **步骤 2**: 执行 3 次 `increment` 操作(使用循环实现)
- **步骤 3**: 执行 1 次 `decrement` 操作
- **步骤 4**: 查看当前计数器值
- **步骤 5**: 执行 `reset` 操作
- **步骤 6**: 再次查看计数器值(应为 0)



#### 3.代码改进

##### `Nonce`管理优化

- **创建了 `updateNonce()` 函数**: 统一管理`nonce`更新逻辑,避免代码重复
- **自动更新机制**: 每次交易完成后自动更新`nonce`,确保后续交易顺序正确
- **错误处理**: 添加了完善的错误处理机制

```go
// 更新 nonce
func updateNonce(ctx context.Context, client *ethclient.Client, auth *bind.TransactOpts) {
    nonce, err := client.PendingNonceAt(ctx, auth.From)
    if err == nil {
        auth.Nonce = new(big.Int).SetUint64(nonce)
    }
}
```



##### 交易等待优化

- **创建了 `waitForTransaction()` 函数**: 统一处理交易确认和结果显示
- **状态检查**: 自动检查交易状态(成功/失败)
- **详细信息显示**: 显示交易哈希、区块号`Gas`使用量等信息

```go
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
```



#### 4.辅助函数

项目包含以下辅助函数,提高代码可维护性：

- **`getCount()`**: 封装获取计数器值
- **`displayCount()`**: 显示计数器值
- **`updateNonce()`**: 更新交易`nonce`
- **`waitForTransaction()`**: 等待交易确认并显示结果
- **`formatWeiToGwei()`**: 格式化`Gas`价格(Wei → Gwei)
- **`maskURL()`**: 隐藏敏感信息(用于日志输出)



#### 5.错误处理

- 所有操作都有完整的错误处理
- 使用 `log.Fatalf` 处理关键错误,确保程序在遇到严重问题时能够及时退出
- 提供清晰的错误信息,便于调试



#### 6.输出格式

- 清晰的步骤提示和操作结果展示
- 使用分隔线区分不同操作阶段
- 显示详细的交易信息(哈希、区块号、`Gas`使用量)



### 七、技术栈

- **Go**: 1.25.1+
- **go-ethereum**: 以太坊`Go`客户端库
- **godotenv**: 环境变量管理
- **abigen**: 智能合约`Go`绑定代码生成工具

