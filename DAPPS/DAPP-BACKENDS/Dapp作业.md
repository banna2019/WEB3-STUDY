## 一、区块链读写任务目标

使用Sepolia测试网络实现基础的区块链交互,包括查询区块和发送交易.
 具体任务

### 1.1.环境搭建

- 安装必要的开发工具,如 Go 语言环境、 go-ethereum 库.
- 注册 Infura 账户,获取 Sepolia 测试网络的 API Key.



#### 创建代币

- **目录结构**

  > 项目路径: "DAPPS/DAPP-BACKENDS/NEWToken"

```bash
 NEWToken git:(main) ✗ tree ./ 
./
├── README.md
├── contracts						// 合约代码
├── hardhat.config.js		//hardhat配置
├── ignition
├── .env.example			// 变量配置文件
├── package-lock.json
├── package.json
├── scripts		// 部署和验证合约脚本目录
└── test			// 测试合约脚本目录

5 directories, 4 files
```



- **`.env.example`部分内容说明**
  - `CONTRACT_ADDRESS`: 在部署合约完整之后,部署脚本会自动进行替换
  - `BLOCK_NUMBER`: 在部署合约完整之后,部署脚本会自动进行替换



- **部署操作命令**

```bash
# 1.安装依赖
npm install

# 2.配置环境变量
cp .env.example .env

## 编辑 `.env` 文件，设置以下变量：
- PRIVATE_KEY: 你的钱包私钥(用于部署合约)
- INFURA_PROJECT_ID: Infura Project ID(用于连接 Sepolia 测试网络)
- ETHERSCAN_API_KEY: Etherscan API Key(用于验证合约)
- TOKEN_NAME: CH Token(代币名称)
- TOKEN_SYMBOL: CHTK(代币符号)
- TOKEN_DECIMALS: 18(代币计算精度)
- TOKEN_INITIAL_SUPPLY: 100000000(代币初始数额)

# 3.检查配置
npm run check-config


# 4.编译合约
npm run compile


# 5.运行测试
npm test


# 6.部署合约
npm run deploy:sepolia


# 7.验证合约
npm run verify:contract
```





### 1.2.查询区块

- 编写 Go 代码,使用 ethclient 连接到 Sepolia 测试网络.
- 实现查询指定区块号的区块信息,包括区块的哈希、时间戳、交易数量等.
- 输出查询结果到控制台.



#### 创建查询项目

- **目录结构**

  > 项目路径: "DAPPS/DAPP-BACKENDS/query-block"

```bash
.
├── .env.example		# 环境变量参数文件
├── go.mod
├── go.sum
└── main.go				 # 代码文件

1 directory, 4 files  
```



- **`.env.example`说明**

```bash
# Sepolia RPC URL和Infura Project ID（二选一）
## Infura Project ID
# INFURA_PROJECT_ID=your_infura_project_id_here

## Sepolia RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR-API-KEY>

# 要查询的区块号（可选，如果不设置则查询最新区块）;这里可以写入上面代币创建时的blockID
BLOCK_NUMBER=block_number
```



- **操作命令**

  > **备注: 推荐使用`Vscode`的`debug`进行测试**

```bash
go mod tidy -e

go run main.go
```





### 1.3.发送交易

- 准备一个 Sepolia 测试网络的以太坊账户,并获取其私钥.
- 编写 Go 代码,使用 ethclient 连接到 Sepolia 测试网络.
- 构造一笔简单的以太币转账交易,指定发送方、接收方和转账金额.
- 对交易进行签名,并将签名后的交易发送到网络.
- 输出交易的哈希值.



#### 创建交易项目

- **目录结构**

  > 项目路径: "DAPPS/DAPP-BACKENDS/send-transfer"

```bash
.
├── .env.example	# 环境变量参数文件
├── go.mod
├── go.sum
└── main.go		# 代码文件

1 directory, 4 files
```



- `.env.example`说明

```bash
# Sepolia RPC URL和Infura Project ID（二选一）
## Sepolia RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR-API-KEY>
## 或者使用 Infura Project ID
INFURA_PROJECT_ID=your_infura_project_id_here

# 发送方私钥（不要包含 0x 前缀）
PRIVATE_KEY=your_private_key_here

# 代币合约地址（CHTK 代币合约地址）
TOKEN_CONTRACT_ADDRESS=token_contract_address
# 或者使用 CONTRACT_ADDRESS（向后兼容）
# CONTRACT_ADDRESS=contract_address

# 接收方钱包地址
TO_ADDRESS=to_address

# 转账金额（代币数量，可选，默认 100）
TRANSFER_AMOUNT=100

# 代币精度（可选，默认 18）
TOKEN_DECIMALS=18
```



- **操作命令**

  > **备注: 推荐使用`Vscode`的`debug`进行测试**

```bash
go mod tidy -e

go run main.go
```







## 二、合约代码生成任务目标

使用 abigen 工具自动生成 Go 绑定代码,用于与 Sepolia 测试网络上的智能合约进行交互.
 具体任务

### 2.1.编写智能合约

- 使用 Solidity 编写一个简单的智能合约,例如一个计数器合约.
- 编译智能合约,生成 ABI 和字节码文件.



#### 创建合约

- **目录结构**

  > 项目路径: "DAPPS/DAPP-BACKENDS/counter-contract"

```bash
.
├── README.md
├── contracts		# 合约代码
├── hardhat.config.js	# hardhat配置
├── ignition
├── .env.example			# 变量配置文件
├── node_modules
├── package-lock.json
├── package.json
├── scripts		# 部署和验证合约脚本目录
└── test			# 测试合约脚本目录
	
8 directories, 5 files
```



- **`.env.example`部分内容说明**
  - `CONTRACT_ADDRESS`: 在部署合约完整之后,部署脚本会自动进行替换
  - `BLOCK_NUMBER`: 在部署合约完整之后,部署脚本会自动进行替换



- **部署操作命令**

```bash
# 1.安装依赖
npm install

# 2.配置环境变量
cp .env.example .env

## 编辑 `.env` 文件，设置以下变量：
- PRIVATE_KEY: 你的钱包私钥(用于部署合约)
- INFURA_PROJECT_ID: Infura Project ID(用于连接 Sepolia 测试网络)
- ETHERSCAN_API_KEY: Etherscan API Key(用于验证合约)

# 3.检查配置
npm run check-config


# 4.编译合约
npm run compile


# 5.运行测试
npm test


# 6.部署合约
npm run deploy:sepolia


# 7.验证合约
npm run verify:contract
```





### 2.2.使用 abigen 生成 Go 绑定代码

- 安装 abigen 工具.
- 使用 abigen 工具根据 ABI 和字节码文件生成 Go 绑定代码.



### 2.3.使用生成的 Go 绑定代码与合约交互

- 编写 Go 代码,使用生成的 Go 绑定代码连接到 Sepolia 测试网络上的智能合约.
- 调用合约的方法,例如增加计数器的值.
- 输出调用结果.





### 2.4.`Go`合约交互示例

> **这里把"2.2.使用 abigen 生成 Go 绑定代码"和"2.3.使用生成的 Go 绑定代码与合约交互"合并到一起**



#### 合约示例

> `SimpleCounter.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SimpleCounter
 * @dev 一个简单的计数器合约
 */
contract SimpleCounter {
    uint256 private count;
    
    // 事件：计数器值改变
    event CountChanged(uint256 oldValue, uint256 newValue);
    
    /**
     * @dev 构造函数，初始化计数器为 0
     */
    constructor() {
        count = 0;
    }
    
    /**
     * @dev 增加计数器值
     * @return 新的计数器值
     */
    function increment() public returns (uint256) {
        uint256 oldValue = count;
        count += 1;
        emit CountChanged(oldValue, count);
        return count;
    }
    
    /**
     * @dev 减少计数器值
     * @return 新的计数器值
     */
    function decrement() public returns (uint256) {
        require(count > 0, "Counter cannot be negative");
        uint256 oldValue = count;
        count -= 1;
        emit CountChanged(oldValue, count);
        return count;
    }
    
    /**
     * @dev 获取当前计数器值
     * @return 当前计数器值
     */
    function getCount() public view returns (uint256) {
        return count;
    }
    
    /**
     * @dev 重置计数器为 0
     */
    function reset() public {
        uint256 oldValue = count;
        count = 0;
        emit CountChanged(oldValue, count);
    }
}
```





#### 创建项目

- **目录结构**

  > 项目路径: "DAPPS/DAPP-BACKENDS/go-trasaction-contract"

```bash
.
├── SimpleCounter.sol		# 合约代码
├── SimpleCounter_sol_SimpleCounter.abi	# 编译后的abi文件
├── counter
│   └── counter.go	# abigen 生成的代码
├── .env.example		# 配置变量参数
├── go.mod
├── go.sum
└── main.go			# 代码文件

2 directories, 6 files  
```



- **`.env.example`部分内容说明**

  - `SEPOLIA_RPC_URL`: 在部署合约完整之后,部署脚本会自动进行替换
  - `INFURA_PROJECT_ID`: 在部署合约完整之后,部署脚本会自动进行替换
  - `COUNTER_CONTRACT_ADDRESS`: 部署的`counter`合约地址
  - `PRIVATE_KEY`: 钱包导出的私钥

  

- **操作命令**

  > **备注: 推荐使用`Vscode`的`debug`进行测试**

```bash
# 使用solcjs生成合约abi文件
solcjs --abi SimpleCounter.sol 

# 使用abigen生成被调用的go代码
abigen --abi=SimpleCounter_sol_SimpleCounter.abi --pkg=counter --out=./counter/counter.go

# 修复依赖包调用
go mod tidy -e

go run main.go
```



- **代码功能说明**

  > **查看项目中的`README.md`文档**





#### `Vscode Debug`演示

![image-20251122042442690](./images/image-20251122042442690.png)

![image-20251122042656959](./images/image-20251122042656959.png)

![image-20251122042707981](./images/image-20251122042707981.png)







