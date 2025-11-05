### 一、快速开始

#### 1.安装依赖

```bash
npm install
```



#### 2.配置环境变量

> 复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

**编辑 `.env` 文件:设置以下变量:**

- `PRIVATE_KEY`: 你的钱包私钥（用于部署合约）
- `INFURA_PROJECT_ID`: Infura Project ID（用于连接 Sepolia 测试网络）
- `ETHERSCAN_API_KEY`: Etherscan API Key（用于验证合约）



#### 3.检查配置

```bash
npm run check-config
```



#### 4.编译合约

```bash
npm run compile
```



#### 5.运行测试

```bash
# 运行所有测试
npm test

# 只运行 Voting 合约测试
npm run test:voting

# 运行交互式测试（本地网络）
npm run test:interactive
```



#### 6.部署合约

```bash
# 部署到 Sepolia 测试网络
npm run deploy:sepolia
```



#### 7.验证合约

```bash
# 使用原生命令（最简单）
npm run verify:direct -- <合约地址>
npm run verify:direct -- 0x59974d161a9099eBB1baC303762441df19851Bc2

# 直接使用 Hardhat
npx hardhat verify --network sepolia <合约地址>
npx hardhat verify --network sepolia 0x59974d161a9099eBB1baC303762441df19851Bc2
```

**注意事项：**

- 使用 `npm run` 时,必须在命令和参数之间添加 `--` 分隔符
- 确保已设置 `ETHERSCAN_API_KEY` 环境变量
- 合约必须已部署到 Sepolia 网络
- 等待几个区块确认后再验证（通常部署后等待 5 个区块）



### 二、项目结构

```bash
.
├── contracts/                    # Solidity 合约文件
│   ├── Voting.sol                # 投票合约（主合约）
│   └── HelloWorld.sol            # 示例合约
├── test/                         # 测试文件
│   ├── Voting.js                 # Voting 合约自动化测试（26个测试用例）
│   └── HelloWorld.js             # HelloWorld 合约测试
├── scripts/                      # 部署和工具脚本
│   ├── deploy.js                 # 部署脚本（包含 Voting 合约部署）
│   ├── test-voting-interactive.js # Voting 合约交互式测试脚本
│   ├── check-config.js           # 配置检查脚本
│   └── verify-contract.js        # 合约验证脚本
├── hardhat.config.js             # Hardhat 配置文件
└── package.json                  # 项目依赖配置
```
