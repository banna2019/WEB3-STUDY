

### 一、快速开始

#### 1.安装依赖

```bash
npm install
```



#### 2.配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

**编辑 `.env` 文件，设置以下变量:**

- `PRIVATE_KEY`: 你的钱包私钥（用于部署合约）
- `INFURA_PROJECT_ID`: Infura Project ID（用于连接 Sepolia 测试网络）
- `ETHERSCAN_API_KEY`: Etherscan API Key（用于验证合约）

s

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
npm test
```



#### 6.部署合约

```bash
npm run deploy:sepolia
```



#### 7.验证合约

```bash
# 使用原生命令（最简单）
npm run verify:direct -- <合约地址>

# 直接使用 Hardhat
npx hardhat verify --network sepolia <合约地址>
```



### 二、项目结构

```bash
.
├── contracts/                         # Solidity 合约文件
│   ├── StringReversal.sol             # 字符串反转合约（主合约）
│   └── HelloWorld.sol                 # 示例合约
├── test/                              # 测试文件
│   ├── StringReversal.js              # StringReversal 合约自动化测试（32个测试用例）
│   └── HelloWorld.js                  # HelloWorld 合约测试
├── scripts/                           # 部署和工具脚本
│   ├── deploy.js                      # 部署脚本（包含 StringReversal 合约部署）
│   ├── test-string-reversal.js        # StringReversal 合约交互式测试脚本
│   ├── verify-contract.js             # 合约验证脚本
│   └── check-config.js                # 配置检查脚本
├── ignition/                          # Hardhat Ignition 目录
│   └── modules/                       # 部署模块
├── artifacts/                         # 编译后的合约文件（自动生成）
├── cache/                             # Hardhat 缓存文件（自动生成）
├── node_modules/                      # 依赖包（自动生成）
├── .env.example                       # 环境变量模板文件
├── .gitignore                         # Git 忽略文件
├── hardhat.config.js                  # Hardhat 配置文件
├── package.json                       # 项目依赖配置
└── package-lock.json                  # 依赖锁定文件（自动生成）
```



#### 主要文件说明

**合约文件：**
- `contracts/StringReversal.sol` - 字符串反转合约，包含以下功能：
  - `reverse()` - 反转字符串
  - `reverseBytes()` - 反转字节数组
  - `verifyReversal()` - 验证反转结果
  - `getStringLength()` - 获取字符串长度

**测试文件：**
- `test/StringReversal.js` - 完整的自动化测试套件，包含 32 个测试用例

**部署脚本：**
- `scripts/deploy.js` - 部署 StringReversal 合约到 Sepolia 测试网络
- `scripts/test-string-reversal.js` - 交互式测试脚本，用于本地测试

**工具脚本：**
- `scripts/verify-contract.js` - 验证合约到 Etherscan
- `scripts/check-config.js` - 检查环境配置是否正确

