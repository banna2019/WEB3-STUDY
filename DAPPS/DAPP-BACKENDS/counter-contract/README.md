# Solidity Project

这是一个基于 Hardhat 的 Solidity 智能合约项目。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下变量：
- `PRIVATE_KEY`: 你的钱包私钥（用于部署合约）
- `INFURA_PROJECT_ID`: Infura Project ID（用于连接 Sepolia 测试网络）
- `ETHERSCAN_API_KEY`: Etherscan API Key（用于验证合约）

### 3. 检查配置

```bash
npm run check-config
```

### 4. 编译合约

```bash
npm run compile
```

### 5. 运行测试

```bash
npm test
```

### 6. 部署合约

```bash
npm run deploy:sepolia
```

### 7. 验证合约

```bash
npm run verify:contract -- --address <合约地址>
```

## 📁 项目结构

```
.
├── contracts/          # Solidity 合约文件
├── test/              # 测试文件
├── scripts/           # 部署和工具脚本
├── hardhat.config.js  # Hardhat 配置文件
└── package.json       # 项目依赖配置
```

## 📚 相关文档

- [Hardhat 文档](https://hardhat.org/docs)
- [Solidity 文档](https://docs.soliditylang.org/)
- [Etherscan API 文档](https://docs.etherscan.io/)

## 📝 许可证

ISC
