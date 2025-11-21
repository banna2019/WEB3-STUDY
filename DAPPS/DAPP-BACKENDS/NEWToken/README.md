## Solidity Project

这是一个基于`Hardhat`的`Solidity`智能合约项目



### 一、功能说明

#### 1.1.`ERC20`代币集成

- 继承 `ERC20` 和 `Ownable`
- 构造函数接收代币名称、符号和初始供应量
- 支持标准的`ERC20`转账、余额查询等功能



#### 1.2.代币管理功能

- `mint()`: 所有者可以铸造新代币
- `burn()`: 用户可以销毁自己的代币
- `getTokenBalance()`: 查询账户代币余额
- `getTotalSupply()`: 查询总供应量



#### 1.3.交易记录增强

- `recordETHTransaction()`: 记录`ETH`转账交易
- `recordTokenTransfer()`: 记录`ERC20`代币转账交易
- `TransactionInfo` 结构体新增 `isTokenTransfer` 字段,区分`ETH`和代币转账



#### 1.4.保持原有功能

- 区块信息记录功能保持不变
- `ETH`接收和提取功能保持不变
- 所有查询功能保持不变





### 二、快速开始

#### 2.1.安装依赖

```bash
npm install
```



#### 2.2.配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件,设置以下变量:
- `PRIVATE_KEY`: 你的钱包私钥(用于部署合约)
- `INFURA_PROJECT_ID`: Infura Project ID(用于连接 Sepolia 测试网络)
- `ETHERSCAN_API_KEY`: Etherscan API Key(用于验证合约)
- TOKEN_NAME: CH Token(代币名称)
- TOKEN_SYMBOL: CHTK(代币符号)
- TOKEN_DECIMALS: 18(代币计算精度)
- TOKEN_INITIAL_SUPPLY: 100000000(代币初始数额)



#### 2.3.执行命令

```bash
# 检查配置
npm run check-config

# 编译合约
npm run compile

# 运行测试
npm test

# 部署合约
npm run deploy:sepolia

# 验证合约
npm run verify:contract
```





### 三、项目结构

```bash
 .
├── README.md
├── contracts						# Solidity 合约文件
├── hardhat.config.js		# Hardhat 配置文件
├── ignition
├── .env.example			# 变量配置文件
├── package-lock.json
├── package.json		# 项目依赖配置
├── scripts		# 部署和验证合约脚本目录
└── test			# 测试合约脚本目录

5 directories, 4 files
```



