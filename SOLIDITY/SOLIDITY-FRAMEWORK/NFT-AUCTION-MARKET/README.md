# NFT拍卖市场

一个功能完整的`NFT`拍卖市场项目,支持`ERC20`和以太坊出价,集成`Chainlink`预言机进行价格计算,并使用`UUPS`代理模式实现合约升级.



## 一、项目概述

本项目实现了一个去中心化的`NFT`拍卖市场,具有以下核心功能：

- **NFT 合约**：基于`ERC721`标准的`NFT`合约,支持铸造和转移
- **拍卖合约**：支持`ERC20`代币和以太坊出价的拍卖系统
- **价格预言机**：集成`Chainlink`预言机,支持多种资产价格查询(加密货币、DeFi代币、稳定币、商品和外汇)
- **工厂模式**：类似`Uniswap V2`的工厂模式,管理所有拍卖实例
- **合约升级**：使用`UUPS`代理模式实现合约可升级性
- **动态手续费**：支持根据拍卖金额动态调整手续费率
- **Gas 分析**：自动化的 Gas 测试和优化建议功能



## 二、项目结构

```bash
NFT-AUCTION-MARKET/
├── contracts/                    # Solidity 合约文件
│   ├── AuctionNFT.sol            # NFT 合约(ERC721)
│   ├── PriceOracle.sol           # 价格预言机合约(Chainlink)
│   ├── Auction.sol               # 普通拍卖合约
│   ├── AuctionUpgradeable.sol    # 可升级拍卖合约(UUPS)
│   ├── AuctionFactory.sol        # 工厂合约
│   └── MockAggregatorV3.sol      # Mock Chainlink 价格源(用于测试)
├── scripts/                      # 部署和工具脚本
│   ├── deploy.js                 # 部署脚本
│   ├── check-config.js           # 配置检查脚本
│   ├── verify-all.js             # 验证所有合约脚本
│   ├── verify-contract.js        # 验证单个合约脚本
│   ├── setup-price-feeds.js      # 设置价格源脚本
│   ├── gas-analysis.js           # Gas 分析脚本
│   └── collect-gas-data.js       # Gas 数据收集脚本
├── test/                         # 测试文件
│   ├── AuctionNFT.test.js        # NFT 合约测试
│   ├── PriceOracle.test.js       # 价格预言机测试
│   ├── Auction.test.js           # 拍卖合约测试
│   ├── AuctionUpgradeable.test.js # 可升级拍卖合约测试
│   └── AuctionFactory.test.js    # 工厂合约测试
├── GasExpenses/                  # Gas 分析报告目录
├── hardhat.config.js             # Hardhat 配置文件
├── package.json                  # 项目依赖配置
├── .env.example                  # 环境变量配置模板
└── README.md                     # 项目文档
```



## 三、快速开始

### 3.1.环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Hardhat >= 2.26.0



### 3.2.安装依赖

```bash
npm install
```



#### 3.2.1.三方依赖包说明

**生产依赖(dependencies)**：

| 包名 | 版本 | 说明 |
|------|------|------|
| `@chainlink/contracts` | ^1.0.0 | Chainlink 合约库,用于集成价格预言机 |
| `@openzeppelin/contracts` | ^5.4.0 | OpenZeppelin 标准合约库(ERC721, Ownable 等) |
| `@openzeppelin/contracts-upgradeable` | ^5.4.0 | OpenZeppelin 可升级合约库(UUPS 代理模式) |
| `@openzeppelin/hardhat-upgrades` | ^3.1.0 | Hardhat 插件,用于部署和管理可升级合约 |



**开发依赖 devDependencies)**：

| 包名 | 版本 | 说明 |
|------|------|------|
| `hardhat` | ^2.26.5 | Hardhat 开发框架 |
| `@nomicfoundation/hardhat-toolbox` | ^6.1.0 | Hardhat 工具包(包含 ethers, chai, mocha 等) |
| `@nomicfoundation/hardhat-verify` | ^2.1.3 | Hardhat 合约验证插件 |
| `dotenv` | ^17.2.3 | 环境变量管理 |
| `hardhat-deploy` | ^1.0.4 | Hardhat 部署插件 |
| `hardhat-gas-reporter` | ^2.3.0 | Gas 消耗报告工具 |
| `solidity-coverage` | ^0.8.16 | Solidity 代码覆盖率工具 |



#### 3.2.2.Hardhat 配置说明

项目使用 `hardhat.config.js` 进行配置,主要配置如下：

**A.Solidity 配置**：

```javascript
solidity: {
  version: "0.8.28",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
}
```

- **版本**: Solidity 0.8.28
- **优化器**: 已启用,运行次数 200
- **优化效果**: 减少合约大小和`Gas`消耗



**B.网络配置**：

| 网络 | RPC URL | Chain ID | 说明 |
|------|---------|----------|------|
| `sepolia` | 自动从环境变量获取 | 11155111 | Sepolia 测试网 |
| `hardhat` | 本地 Hardhat 网络 | 31337 | 本地测试网络 |
| `localhost` | http://127.0.0.1:8545 | 31337 | 本地节点网络 |



- **`Sepolia`网络`RPC URL`配置**：
  - 优先使用 `SEPOLIA_RPC_URL` 环境变量(完整`URL`)
  - 或使用 `INFURA_PROJECT_ID` 自动构建`URL`
  - 如果都未设置,使用公共 RPC: `https://rpc.sepolia.org`



**C.`Etherscan`配置**：

```javascript
etherscan: {
  apiKey: process.env.ETHERSCAN_API_KEY || "",
}
```

- 使用`Etherscan API V2`(统一`API Key`)
- 从环境变量 `ETHERSCAN_API_KEY` 读取



**D.路径配置**：

```javascript
paths: {
  sources: "./contracts",
  tests: "./test",
  cache: "./cache",
  artifacts: "./artifacts",
}
```



**E.插件配置**：

- `@nomicfoundation/hardhat-toolbox`: 提供测试、编译等核心功能
- `@openzeppelin/hardhat-upgrades`: 提供可升级合约部署和管理功能



### 3.3.配置环境变量

项目提供了 `.env.example` 文件作为配置模板.按以下步骤配置：

**1.复制环境变量模板**：

```bash
cp .env.example .env
```



**2.编辑 `.env` 文件**,填写必要的配置：

**必需配置**：

- `PRIVATE_KEY`: 部署账户私钥(不要包含`0x`前缀)
- `ETHERSCAN_API_KEY`: `Etherscan API Key`(用于验证合约)

**网络配置**(二选一)：

- `SEPOLIA_RPC_URL`: `Sepolia`测试网`RPC URL`(完整`URL`)
- 或 `INFURA_PROJECT_ID`: `Infura Project ID`(会自动构建`URL`)

**可选配置**：

- `CHAINLINK_ETH_USD_FEED`: `Chainlink ETH/USD`价格源地址(默认已设置)
- `FEE_RATE`: 手续费率(基点,默认 250 = 2.5%)
- `FEE_RECIPIENT`: 手续费接收地址(默认为部署者地址)
- `NFT_NAME`: NFT 集合名称(默认"Auction NFT Collection")
- `NFT_SYMBOL`: NFT 集合符号(默认"ANFT")



**3.检查配置**：

```bash
npm run check-config
```

**注意**：`.env` 文件包含敏感信息,请勿提交到版本控制系统.合约地址会在部署后自动写入 `.env` 文件.



### 3.4.编译合约

```bash
npm run compile
```



### 3.5.运行测试

```bash
npm test
```



### 3.6.部署到Sepolia测试网

```bash
npm run deploy:sepolia
```

部署脚本会自动：
- 1.部署所有合约(`NFT`、价格预言机、拍卖合约、工厂合约)
- 2.部署可升级拍卖合约(`UUPS`代理模式)
- 3.将合约地址和验证参数保存到 `.env` 文件
- 4.可选：验证合约到`Etherscan`



### 3.7.验证合约

部署后,可以使用以下方式验证合约：

**方式1: 验证所有合约(推荐)**

```bash
npm run verify:all
```

此命令会：
- 从 `.env` 文件读取所有合约地址和验证参数
- 自动验证所有已部署的合约
- 如果验证参数缺失,会自动从部署配置中获取并更新到 `.env` 文件
- 显示验证摘要(成功/失败/跳过)



**方式2: 验证单个合约**

```bash
npm run verify:contract
# 或
npx hardhat verify --network sepolia <合约地址> <构造函数参数...>
##  这参考.env中的环境变量对应参数信息
npx hardhat verify --network sepolia <合约地址> <NFT 集合名称|NFT_NAME> <# NFT 集合符号|NFT_SYMBOL>
```



**方式3: 直接验证(使用 hardhat verify)**

```bash
npm run verify:direct -- <合约地址> <构造函数参数...>
##  这参考.env中的环境变量对应参数信息
npm run verify:direct -- <合约地址> <NFT 集合名称|NFT_NAME> <# NFT 集合符号|NFT_SYMBOL>
```



**验证参数说明**：

验证脚本会自动从 `.env` 文件读取以下验证参数：
- `NFT_NAME`: `NFT`合约名称
- `NFT_SYMBOL`: `NFT`合约符号
- `PRICE_ORACLE_VERIFY_FEED`: 价格预言机`Chainlink Feed`地址
- `AUCTION_VERIFY_ORACLE`: 拍卖合约使用的价格预言机地址
- `AUCTION_VERIFY_FEE_RATE`: 拍卖合约手续费率
- `AUCTION_VERIFY_FEE_RECIPIENT`: 拍卖合约手续费接收地址
- `AUCTION_UPGRADEABLE_VERIFY_ORACLE`: 可升级拍卖合约使用的价格预言机地址
- `AUCTION_UPGRADEABLE_VERIFY_FEE_RATE`: 可升级拍卖合约手续费率
- `AUCTION_UPGRADEABLE_VERIFY_FEE_RECIPIENT`: 可升级拍卖合约手续费接收地址

这些参数会在部署时自动写入 `.env` 文件,无需手动配置.



### 3.8.设置价格源

部署合约后,可以使用以下命令批量设置`Chainlink`价格源：

```bash
npm run setup:price-feeds
```

此命令会：
- 自动从 `.env` 文件读取价格源配置
- 验证价格源是否可用
- 批量设置所有可用的价格源
- 显示设置结果和当前价格

详细说明请参考[五、Chainlink 价格源使用指南](#五chainlink-价格源使用指南)



### 3.9.Gas分析

运行以下命令生成`Gas`分析报告：

```bash
npm run gas:analysis
```

此命令会：
- 运行所有测试并收集`Gas`数据
- 分析每个合约的`Gas`使用情况
- 生成优化建议
- 导出`Markdown`报告到 `GasExpenses/` 目录

详细说明请参考[9.2.Gas测试报告功能](#92gas测试报告功能)



## 四、合约说明

### 4.1.AuctionNFT

`ERC721 NFT`合约,支持铸造和转移.



#### **主要功能**

- `mint(address to, string uri)`: 铸造`NFT`(仅所有者)
- `batchMint(address to, string[] uris)`: 批量铸造`NFT`(仅所有者)
- `tokenURI(uint256 tokenId)`: 查询`NFT`元数据`URI`
- `totalSupply()`: 查询已铸造的`NFT`总数



### 4.2.PriceOracle

价格预言机合约,集成`Chainlink`获取实时价格.



#### **主要功能**

- `getETHPrice()`: 获取`ETH/USD`价格
- `getERC20Price(address token)`: 获取`ERC20/USD`价格
- `convertETHToUSD(uint256 ethAmount)`: 将`ETH`金额转换为美元
- `convertERC20ToUSD(address token, uint256 amount, uint8 decimals)`: 将`ERC20`金额转换为美元
- `compareBids(...)`: 比较`ETH`和`ERC20`出价
- `setERC20PriceFeed(address token, address priceFeed)`: 设置`ERC20`价格源
- `setERC20PriceFeedsBatch(address[] tokens, address[] priceFeeds)`: 批量设置价格源
- `hasPriceFeed(address token)`: 检查价格源是否已设置



#### **支持的价格源类型**

> 本项目支持通过`Chainlink`预言机获取以下资产的价格数据：



##### 1.加密货币价格(最常用的价格对)

| 价格对 | 说明 | Sepolia 测试网地址 |
|--------|------|-------------------|
| **ETH/USD** | 以太坊/美元 | `0x694AA1769357215DE4FAC081bf1f309aDC325306` |
| **BTC/USD** | 比特币/美元 | `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43` |
| **BNB/USD** | 币安币/美元 | `0x2a548935a323Bb7329a5E3F1667B979f16Bc890b` |
| **MATIC/USD** | Polygon/美元 | `0xd0D5e3DB44DE05E9F294B0a3eaa313A7fdAbEE354` |
| **ARB/USD** | Arbitrum/美元 | 需参考 Chainlink 文档确认地址 |



##### 2.DeFi代币价格

| 价格对 | 说明 | Sepolia 测试网地址 |
|--------|------|-------------------|
| **AAVE/USD** | Aave/美元 | `0x81cc0c227BF9Bfb8088B14755DfcA65f7892203b` |
| **UNI/USD** | Uniswap/美元 | 需参考 Chainlink 文档确认地址 |
| **LINK/USD** | Chainlink/美元 | `0xc59E3633BAAC79493d908e63626716e8A43dbC8B` |
| **CRV/USD** | Curve/美元 | 需参考 Chainlink 文档确认地址 |
| **MKR/USD** | Maker/美元 | `0xec1D1B3b0443256cc3860e24a46F108e699484Aa` |



##### 3.稳定币价格

| 价格对 | 说明 | Sepolia 测试网地址 |
|--------|------|-------------------|
| **USDC/USD** | USD Coin/美元 | `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E` |
| **USDT/USD** | Tether/美元 | `0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0` |
| **DAI/USD** | Dai/美元 | `0x14866185B1962B63C3Ea9E03Bc1da838bab34C19` |
| **FRAX/USD** | Frax/美元 | 需参考 Chainlink 文档确认地址 |



##### 4.商品和外汇(Chainlink提供的传统资产价格)

| 价格对 | 说明 | Sepolia 测试网地址 |
|--------|------|-------------------|
| **XAU/USD** | 黄金/美元 | 需参考 Chainlink 文档确认地址 |
| **XAG/USD** | 白银/美元 | 需参考 Chainlink 文档确认地址 |
| **EUR/USD** | 欧元/美元 | `0x44390589104C9164407A0E0562a9DBe6C24A0E05` |
| **JPY/USD** | 日元/美元 | 需参考 Chainlink 文档确认地址 |



**注意**：

- 以上地址为示例地址,实际部署时请参考[Chainlink官方文档](https://docs.chain.link/data-feeds/price-feeds/addresses)获取最新地址
- 部分价格源在测试网可能不可用,请根据实际网络情况选择
- 主网和测试网的价格源地址不同,请确保使用正确的网络地址



#### **Sepolia 测试网价格源可用性**

> 根据实际测试,以下价格源在`Sepolia`测试网上可用：

**A.可用价格源**：

- ETH/USD: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- BTC/USD: `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`
- USDC/USD: `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E`
- DAI/USD: `0x14866185B1962B63C3Ea9E03Bc1da838bab34C19`
- LINK/USD: `0xc59E3633BAAC79493d908e63626716e8A43dbC8B`
- EUR/USD: `0x44390589104C9164407A0E0562a9DBe6C24A0E05`

 

**B.可能不可用的价格源**(需要验证)：

- USDT/USD: 在测试网可能不存在或地址不正确
- CRV/USD: 在测试网可能不存在
- MKR/USD: 在测试网可能不存在
- FRAX/USD: 在测试网可能不存在
- 其他 DeFi 代币和商品价格源在测试网可能不可用



**提示**：

- 使用 `npm run setup:price-feeds` 脚本会自动验证价格源是否可用
- 脚本会跳过不可用的价格源,只设置可用的价格源
- 如果价格源设置失败,请检查地址是否正确或该价格源在测试网是否可用



**使用示例**：

```solidity
// 1. 设置价格源
priceOracle.setERC20PriceFeed(tokenAddress, priceFeedAddress);

// 2. 批量设置价格源
address[] memory tokens = [token1, token2, token3];
address[] memory feeds = [feed1, feed2, feed3];
priceOracle.setERC20PriceFeedsBatch(tokens, feeds);

// 3. 获取价格
(int256 price, uint8 decimals) = priceOracle.getERC20Price(tokenAddress);

// 4. 转换金额
uint256 usdAmount = priceOracle.convertERC20ToUSD(tokenAddress, tokenAmount, 18);
```



### 4.3.Auction

普通拍卖合约,支持`ERC20`和以太坊出价.



#### **主要功能**

- `createAuction(...)`: 创建拍卖
- `bidWithETH(uint256 auctionId)`: 使用`ETH`出价
- `bidWithERC20(uint256 auctionId, address token, uint256 amount)`: 使用`ERC20`出价
- `endAuction(uint256 auctionId)`: 结束拍卖
- `cancelAuction(uint256 auctionId)`: 取消拍卖(仅卖家)
- `getAuctionInfo(uint256 auctionId)`: 查询拍卖信息
- `getBidInfo(uint256 auctionId, address bidder)`: 查询出价信息



#### **拍卖流程**

- 1.卖家创建拍卖,将`NFT`转移到合约
- 2.买家使用`ETH`或`ERC20`出价
- 3.出价必须高于当前最高出价和底价
- 4.之前的出价会自动退还
- 5.拍卖结束后,`NFT`转移给获胜者,资金转移给卖家(扣除手续费)



### 4.4.AuctionUpgradeable

可升级的拍卖合约(`UUPS`代理模式),继承 `Auction` 的所有功能,并支持：



#### **额外功能**

- `setDynamicFeeRate(uint256 auctionId, uint256 newFeeRate)`: 设置动态手续费率(仅所有者)
- `getVersion()`: 查询合约版本号
- 支持合约升级(仅所有者)



#### **升级流程**

- 1.部署新版本的实现合约
- 2.调用代理合约的 `upgradeTo(address newImplementation)` 函数
- 3.新版本合约自动生效



### 4.5.AuctionFactory

工厂合约,管理所有拍卖实例(类似`Uniswap V2`工厂模式).



#### **主要功能**

- `createAuction(...)`: 创建新的拍卖合约实例
- `getAuctionsCount()`: 获取所有拍卖数量
- `getAuction(uint256 index)`: 通过索引获取拍卖地址
- `getUserAuctions(address user)`: 获取用户创建的所有拍卖
- `getUserAuctionsCount(address user)`: 获取用户创建的拍卖数量



## 五、Chainlink 价格源使用指南

### 5.1.价格源概述

> **本项目集成了`Chainlink`预言机网络,支持获取多种资产类型的实时价格数据.价格源分为以下四类：**



#### 5.1.1.加密货币价格(最常用的价格对)

支持主流加密货币的美元价格查询：

- **ETH/USD**: 以太坊/美元价格
- **BTC/USD**: 比特币/美元价格
- **BNB/USD**: 币安币/美元价格
- **MATIC/USD**: Polygon/美元价格
- **ARB/USD**: Arbitrum/美元价格



#### 5.1.2.DeFi代币价格

支持主流`DeFi`代币的美元价格查询：

- **AAVE/USD**: Aave协议代币/美元价格
- **UNI/USD**: Uniswap协议代币/美元价格
- **LINK/USD**: Chainlink代币/美元价格
- **CRV/USD**: Curve协议代币/美元价格
- **MKR/USD**: Maker协议代币/美元价格



#### 5.1.3.稳定币价格

支持主流稳定币的美元价格查询：

- **USDC/USD**: USD Coin/美元价格
- **USDT/USD**: Tether/美元价格
- **DAI/USD**: Dai稳定币/美元价格
- **FRAX/USD**: Frax稳定币/美元价格



#### 5.1.4.商品和外汇(Chainlink提供的传统资产价格)

支持传统资产和外汇的美元价格查询：

- **XAU/USD**: 黄金/美元价格
- **XAG/USD**: 白银/美元价格
- **EUR/USD**: 欧元/美元汇率
- **JPY/USD**: 日元/美元汇率



### 5.2.配置价格源

#### 5.2.1.环境变量配置

> 在`.env`文件中配置价格源地址和代币地址：

```env
# ETH/USD 价格源(默认,必需)
CHAINLINK_ETH_USD_FEED=0x694AA1769357215DE4FAC081bf1f309aDC325306

# 其他价格源地址(可选)
CHAINLINK_BTC_USD_FEED=0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
CHAINLINK_USDC_USD_FEED=0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E
CHAINLINK_USDT_USD_FEED=0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
# ... 更多价格源地址

# 代币地址(用于设置价格源)
USDC_TOKEN=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
USDT_TOKEN=0xdAC17F958D2ee523a2206206994597C13D831ec7
DAI_TOKEN=0x6B175474E89094C44Da98b954EedeAC495271d0F
# ... 更多代币地址
```



#### 5.2.2.使用脚本批量设置价格源(推荐)

部署合约后,可以使用脚本批量设置价格源：

```bash
npm run setup:price-feeds
```

此脚本会：
- 自动从`.env`文件读取价格源配置
- 批量设置所有配置的价格源
- 验证价格源是否设置成功
- 显示设置结果和当前价格



#### 5.2.3.合约中手动设置价格源

部署合约后,可以通过以下方式设置价格源：

**方式1: 单个设置**

```solidity
// 设置 USDC/USD 价格源
address usdcToken = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address usdcPriceFeed = 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E;
priceOracle.setERC20PriceFeed(usdcToken, usdcPriceFeed);
```



**方式2: 批量设置**

```solidity
address[] memory tokens = [
    0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, // USDC
    0xdAC17F958D2ee523a2206206994597C13D831ec7  // USDT
];
address[] memory feeds = [
    0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E, // USDC/USD
    0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0  // USDT/USD
];
priceOracle.setERC20PriceFeedsBatch(tokens, feeds);
```



### 5.3.获取价格数据

#### 5.3.1.获取ETH价格

```solidity
(int256 price, uint8 decimals) = priceOracle.getETHPrice();
// price: 价格值(带8位小数,例如 300000000000 表示 $3000.00)
// decimals: 精度(通常为8)
```



#### 5.3.2.获取ERC20代币价格

```solidity
address token = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // USDC
(int256 price, uint8 decimals) = priceOracle.getERC20Price(token);
```



#### 5.3.3.价格转换

```solidity
// ETH 转 USD
uint256 ethAmount = ethers.parseEther("1.0"); // 1 ETH
uint256 usdAmount = priceOracle.convertETHToUSD(ethAmount);

// ERC20 转 USD
uint256 tokenAmount = ethers.parseUnits("1000", 6); // 1000 USDC (6位小数)
uint256 usdAmount = priceOracle.convertERC20ToUSD(token, tokenAmount, 6);
```



### 5.4.价格源地址参考

**`Sepolia`测试网价格源地址**：

| 价格对 | 地址 |
|--------|------|
| ETH/USD | `0x694AA1769357215DE4FAC081bf1f309aDC325306` |
| BTC/USD | `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43` |
| LINK/USD | `0xc59E3633BAAC79493d908e63626716e8A43dbC8B` |
| USDC/USD | `0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E` |
| USDT/USD | `0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0` |
| DAI/USD | `0x14866185B1962B63C3Ea9E03Bc1da838bab34C19` |
| EUR/USD | `0x44390589104C9164407A0E0562a9DBe6C24A0E05` |

**重要提示**：

- 完整的价格源地址列表请参考[Chainlink官方文档](https://docs.chain.link/data-feeds/price-feeds/addresses)
- 不同网络(主网/测试网)的价格源地址不同
- 部分价格源在测试网可能不可用
- 价格数据通常有8位小数精度
- 价格更新频率取决于Chainlink网络的配置



### 5.5.在拍卖中使用价格源

在拍卖合约中,价格源用于：

- **1.比较不同代币的出价**: 将`ETH`和`ERC20`代币出价转换为美元进行比较
- **2.设置底价**: 支持使用不同代币设置底价,统一转换为美元比较
- **3.实时价格查询**: 获取最新的资产价格用于拍卖决策

**示例**：

```solidity
// 在拍卖中比较ETH和USDC出价
uint256 ethBid = ethers.parseEther("1.0");
uint256 usdcBid = ethers.parseUnits("3000", 6);
address usdcToken = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

(bool isETHHigher, uint256 higherBidUSD) = priceOracle.compareBids(
    ethBid,
    usdcToken,
    usdcBid,
    6 // USDC 精度为 6
);
```



## 六、测试

> 项目包含完整的测试套件,覆盖所有合约功能：

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npx hardhat test test/AuctionNFT.test.js
npx hardhat test test/PriceOracle.test.js
npx hardhat test test/Auction.test.js
npx hardhat test test/AuctionUpgradeable.test.js
npx hardhat test test/AuctionFactory.test.js
```



**测试覆盖**：

- `NFT`合约：部署、铸造、转移
- 价格预言机：价格查询、转换、比较
- 拍卖合约：创建、出价、结束、取消
- 可升级拍卖合约：初始化、动态手续费、升级
- 工厂合约：创建、查询、管理



## 七、代理模式说明

### 7.1.代理模式概述

本项目使用**UUPS (Universal Upgradeable Proxy Standard)**代理模式实现合约的可升级性.

**UUPS代理模式特点**：

- **实现合约**：包含业务逻辑的实现合约(`AuctionUpgradeable`)
- **代理合约**：存储状态数据的代理合约(由`OpenZeppelin`自动生成)
- **升级机制**：通过代理合约指向新的实现合约地址实现升级
- **状态保持**：升级后状态数据保持不变,只更新逻辑代码



### 7.2.UUPS vs 其他代理模式

| 特性 | UUPS | Transparent Proxy | Beacon Proxy |
|------|------|-------------------|--------------|
| **Gas 消耗** | 较低 | 中等 | 最低 |
| **升级权限** | 在实现合约中 | 在代理合约中 | 在 Beacon 合约中 |
| **复杂度** | 中等 | 较低 | 较高 |
| **适用场景** | 单个合约升级 | 简单升级场景 | 多个合约统一升级 |



**本项目选择UUPS`的原因**：

- `Gas`效率高：升级函数在实现合约中,减少代理合约大小
- 灵活性好：每个合约独立管理升级权限
- 安全性高：升级逻辑在实现合约中,便于审计



### 7.3.代理模式架构

```
┌─────────────────────────────────────────┐
│         用户调用                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  代理合约 (Proxy Contract)               │
│  - 存储状态数据                           │
│  - 委托调用实现合约                       │
└──────────────┬──────────────────────────┘
               │ delegatecall
               ▼
┌─────────────────────────────────────────┐
│   实现合约 (Implementation Contract)     │
│  - AuctionUpgradeable.sol               │
│  - 包含业务逻辑                           │
│  - 包含升级函数                           │
└─────────────────────────────────────────┘
```



### 7.4.实现细节

#### 7.4.1.合约继承

```solidity
contract AuctionUpgradeable is 
    UUPSUpgradeable,      // UUPS 代理支持
    OwnableUpgradeable,   // 可升级的所有权管理
    IERC721Receiver       // NFT 接收支持
{
    // 实现 _authorizeUpgrade 函数
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyOwner 
    {}
}
```



#### 7.4.2.初始化函数

```solidity
function initialize(
    address _priceOracle,
    uint256 _feeRate,
    address _feeRecipient
) public initializer {
    __Ownable_init(msg.sender);
    // 初始化逻辑...
}
```

**重要**：

- 使用 `initializer` 修饰符防止重复初始化
- 使用 `__Ownable_init` 初始化可升级的所有权
- 不能使用构造函数,必须使用 `initialize` 函数



#### 7.4.3.升级授权

```solidity
function _authorizeUpgrade(address newImplementation) 
    internal 
    override 
    onlyOwner 
{}
```

- 只有合约所有者可以授权升级
- 在实现合约中定义,不在代理合约中
- 可以添加额外的升级条件检查



### 7.5.部署流程

**使用`OpenZeppelin Hardhat Upgrades`插件部署**：

```javascript
const { upgrades } = require("hardhat");

// 部署可升级合约
const AuctionUpgradeable = await ethers.getContractFactory("AuctionUpgradeable");
const auctionUpgradeable = await upgrades.deployProxy(
  AuctionUpgradeable,
  [oracleAddress, feeRate, feeRecipient],
  { 
    initializer: "initialize", 
    kind: "uups" 
  }
);
```

**部署结果**：

- **代理合约地址**：用户交互的地址
- **实现合约地址**：包含业务逻辑的地址
- **代理存储**：状态数据存储在代理合约中



### 7.6.升级流程

#### 7.6.1.准备新版本

- 1.修改实现合约代码
- 2.确保新版本兼容旧版本的状态变量布局
- 3.编译新版本合约



#### 7.6.2.部署新实现

```javascript
// 部署新版本的实现合约
const AuctionUpgradeableV2 = await ethers.getContractFactory("AuctionUpgradeableV2");
const newImplementation = await AuctionUpgradeableV2.deploy();
await newImplementation.waitForDeployment();
```



#### 7.6.3.执行升级

```javascript
// 通过代理合约升级
const proxy = await ethers.getContractAt("AuctionUpgradeable", proxyAddress);
await proxy.upgradeTo(await newImplementation.getAddress());
```



**升级过程**：

- 1.调用代理合约的 `upgradeTo` 函数
- 2.代理合约更新实现合约地址
- 3.所有状态数据保持不变
- 4.新逻辑立即生效



### 7.7.升级注意事项

#### 7.7.1.状态变量兼容性

**允许的操作**：

- 在状态变量末尾添加新变量
- 修改现有变量的可见性
- 修改函数实现



**不允许的操作**：

- 删除现有状态变量
- 改变状态变量的顺序
- 改变状态变量的类型
- 在现有变量之间插入新变量



#### 7.7.2.初始化函数

- 新版本实现合约不能有构造函数
- 必须使用 `initializer` 修饰符
- 升级时不会调用初始化函数



#### 7.7.3.安全考虑

- **权限控制**：确保只有授权地址可以升级
- **测试验证**：升级前充分测试新版本
- **备份数据**：升级前备份重要状态数据
- **分阶段升级**：复杂升级可以分阶段进行



### 7.8.代理合约地址说明

部署后会产生两个地址：

| 地址类型 | 说明 | 用途 |
|---------|------|------|
| **代理合约地址** | `AUCTION_UPGRADEABLE_ADDRESS` | 用户交互的地址,存储状态数据 |
| **实现合约地址** | `AUCTION_IMPLEMENTATION_ADDRESS` | 包含业务逻辑,可被替换 |

**重要提示**：

- 用户应该使用**代理合约地址**进行交互
- 实现合约地址会随升级而改变
- 验证合约时,需要验证**实现合约地址**



### 7.9.验证代理合约

**验证实现合约**：

```bash
# 验证实现合约(需要构造函数参数,但 UUPS 实现合约没有构造函数)
npx hardhat verify --network sepolia <实现合约地址>
```

**验证代理合约**：

代理合约由`OpenZeppelin`自动生成,通常不需要单独验证.如果需要验证,可以使用`OpenZeppelin`的验证工具.



### 7.10.优势与限制

**优势**：

- 支持合约逻辑升级,修复`bug`或添加新功能
- 状态数据在升级后保持不变
- `Gas`效率较高
- 灵活的升级权限管理



**限制**：

- 状态变量布局必须保持兼容
- 需要仔细管理升级权限
- 升级过程不可逆
- 需要充分测试新版本



### 7.11.相关资源

- [OpenZeppelin UUPS 文档](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#uups-proxies)
- [OpenZeppelin Hardhat Upgrades 插件](https://docs.openzeppelin.com/upgrades-plugins/1.x/hardhat-upgrades)
- [EIP-1822: Universal Upgradeable Proxy Standard](https://eips.ethereum.org/EIPS/eip-1822)



## 八、安全特性

- **1.访问控制**：使用`OpenZeppelin`的 `Ownable` 和 `OwnableUpgradeable` 实现权限管理
- **2.重入攻击防护**：使用`OpenZeppelin`的 `SafeERC20` 和 `ReentrancyGuard`(如需要)
- **3.输入验证**：所有函数都包含参数验证
- **4.安全转账**：使用 `safeTransferFrom` 和 `safeTransfer` 进行`NFT`和`ERC20`转账
- **5.代理模式**：使用`UUPS`代理模式,确保升级安全(详细说明请参考[七、代理模式说明](#七代理模式说明))



## 九、Gas消耗估算

### 9.1.基础Gas消耗估算

| 操作 | 估算 Gas |
|------|---------|
| 部署 NFT 合约 | ~3,500,000 |
| 部署价格预言机 | ~1,200,000 |
| 部署拍卖合约 | ~4,500,000 |
| 部署可升级拍卖合约(代理) | ~5,000,000 |
| 部署工厂合约 | ~1,800,000 |
| 创建拍卖 | ~150,000 |
| ETH 出价 | ~80,000 |
| ERC20 出价 | ~120,000 |
| 结束拍卖 | ~200,000 |

*注：实际`Gas`消耗可能因网络状况而异*



### 9.2.Gas测试报告功能

项目提供了自动化的`Gas`测试和报告生成功能,可以全面分析合约的`Gas`使用情况并生成优化建议.

#### 9.2.1.功能特性

**Gas 数据收集**：

- 自动运行所有测试套件
- 实际部署合约并调用函数收集真实`Gas`数据
- 支持所有主要合约的`Gas`测试
- 自动处理合约依赖关系



**报告生成**：

- 生成详细的`Gas`使用分析报告(`gas-report-*.md`)
- 生成`Gas`优化建议报告(`gas-optimization-*.md`)
- 自动保存到 `GasExpenses/` 目录
- 包含时间戳,便于版本对比



**分析内容**：

- 每个合约的部署`Gas`消耗
- 每个函数的`Gas`消耗统计
- `Gas`等级分类(`low/medium/high/very_high`)
- 总体统计信息(总`Gas`、平均`Gas`等)



#### 9.2.2.使用方法

运行以下命令生成`Gas`分析报告：

```bash
npm run gas:analysis
```

脚本执行流程：

- **1.运行测试套件**：自动执行所有测试,收集基础`Gas`数据
- **2.收集实际 Gas 数据**：部署合约并调用函数,获取真实`Gas`消耗
- **3.分析 Gas 使用情况**：对每个合约和函数进行`Gas`分析
- **4.生成优化建议**：基于代码分析生成优化建议
- **5.导出报告**：生成`Markdown`格式的报告文件



#### 9.2.3.报告文件说明

**Gas 使用分析报告** (`gas-report-*.md`)：

包含以下内容：
- 合约部署`Gas`消耗
- 函数`Gas`消耗统计表
- `Gas`等级评估
- 总体统计信息



**Gas 优化建议报告** (`gas-optimization-*.md`)：

包含以下内容：
- 代码级别的优化建议(`Storage`、循环、外部调用等)
- 高`Gas`函数的详细优化建议
- 通用优化策略
- 优化影响评估(`high/medium/low`)



#### 9.2.4.技术实现

**核心脚本**：

- `scripts/gas-analysis.js`：主分析脚本
  - 运行测试并收集`Gas`数据
  - 分析合约`Gas`使用情况
  - 生成`Markdown`报告

- `scripts/collect-gas-data.js`：Gas 数据收集脚本
  - 实际部署合约
  - 调用函数并收集`Gas`消耗
  - 处理合约依赖关系



**技术要点**：

**1.Gas数据收集**：

```javascript
// 部署合约并获取 Gas
const deployTx = await ContractFactory.deploy(...);
const deployReceipt = await deployTx.waitForDeployment();
const deployGas = (await deployReceipt.deploymentTransaction().wait()).gasUsed;

// 调用函数并获取 Gas
const functionTx = await contract.functionName(...);
const functionReceipt = await functionTx.wait();
const functionGas = functionReceipt.gasUsed;
```



**2.Gas等级分类**：

```javascript
const gasThresholds = {
  deployment: {
    low: 1000000,
    medium: 3000000,
    high: 5000000
  },
  function: {
    low: 50000,
    medium: 100000,
    high: 200000
  }
};
```



**3.代码分析**：

- 分析`Storage`使用模式
- 检测循环中的`Storage`操作
- 识别字符串使用情况
- 检测外部调用模式



**4.报告生成**：

- 使用`Markdown`格式
- 包含表格、代码块、列表等格式
- 自动添加时间戳和统计信息



### 9.3.Gas 优化功能

#### 9.3.1.优化建议类型

**A.Storage优化**：

| 优化点 | 建议 | 影响 |
|--------|------|------|
| Mapping 使用 | 考虑使用 packed storage 减少 storage slot | 高 |
| 数据类型 | 使用更小的类型(uint128, uint64)节省 storage | 中 |
| 字符串存储 | 使用 bytes32 或 events 代替 string memory | 高 |



**B.循环优化**：

| 优化点 | 建议 | 影响 |
|--------|------|------|
| Storage 操作 | 避免在循环中进行 storage 读写 | 高 |
| 批量操作 | 使用批量操作代替多次单独操作 | 高 |
| 数组操作 | 如果大小已知,使用固定大小数组 | 中 |



**C.外部调用优化**：

| 优化点 | 建议 | 影响 |
|--------|------|------|
| 批量调用 | 批量外部调用,减少调用次数 | 中 |
| 转账方式 | 使用低级别 call 代替 transfer | 低 |
| 结果缓存 | 缓存外部调用结果 | 中 |



#### 9.3.2.优化策略

**通用优化策略**：

**1.Storage 优化**：

- 使用`packed storage`减少`storage slot`使用
- 使用更小的数据类型(`uint128`, `uint64`等)
- 将相关数据打包到单个`storage slot`



**2.循环优化**：

- 避免在循环中进行 storage 操作
- 使用批量操作代替多次单独操作
- 考虑使用映射代替数组遍历



**3.外部调用优化**：

- 批量外部调用
- 使用低级别`call`代替`transfer`
- 缓存外部调用结果



**4.事件优化**：

- 使用`indexed`参数提高查询效率(但会增加`Gas`)
- 将非关键数据存储在`events`而不是`storage`



#### 9.3.3.优化检测机制

**自动检测**：

脚本会自动检测以下优化点：

- **Storage 模式检测**：
  ```javascript
  // 检测 mapping 和 uint256 的组合使用
  if (contractCode.includes("mapping") && contractCode.includes("uint256")) {
    // 生成优化建议
  }
  ```

- **循环检测**：
  ```javascript
  // 检测循环中的 storage 操作
  if (contractCode.includes("for (") && contractCode.includes("storage")) {
    // 生成优化建议
  }
  ```

- **字符串检测**：
  ```javascript
  // 检测大量 string memory 使用
  if (contractCode.match(/string\s+memory/g)?.length > 3) {
    // 生成优化建议
  }
  ```



**高`Gas函数分析**：

对于`Gas`消耗超过阈值的函数,脚本会：
- 标记为高`Gas`函数
- 提供针对性的优化建议
- 分析函数逻辑,提供具体优化方案



#### 9.3.4.优化效果评估

**影响等级**：

- **高影响**：可以显著减少 Gas 消耗(>20%)
- **中影响**：可以适度减少 Gas 消耗(10-20%)
- **低影响**：可以轻微减少 Gas 消耗(<10%)



**优化建议格式**：

每个优化建议包含：
- 优化类型(`Storage`/循环/外部调用等)
- 问题描述
- 优化建议
- 影响等级



#### 9.3.5.使用示例

**查看`Gas`报告**：

```bash
# 生成报告
npm run gas:analysis

# 查看报告
cat GasExpenses/gas-report-*.md
cat GasExpenses/gas-optimization-*.md
```



**报告内容示例**：

```markdown
## AuctionNFT

### 部署 Gas
| 指标 | 值 | 等级 |
|------|-----|------|
| Gas 消耗 | 1,554,172 | low |

### 函数 Gas 消耗
| 函数名 | Gas 消耗 | 等级 |
|--------|----------|------|
| mint | 105,875 | medium |
| batchMint | 160,711 | medium |

### 优化建议
#### STORAGE - 使用 mapping(uint256 => ...) 可能可以优化
**影响**: medium
**建议**: 考虑使用 packed storage 或更小的数据类型
```



#### 9.3.6.最佳实践

**1.定期运行 Gas 分析**：

- 在每次重大更新后运行
- 对比不同版本的`Gas`消耗
- 跟踪优化效果



**2.关注高 Gas 函数**：

- 优先优化`Gas`消耗高的函数
- 分析函数逻辑,寻找优化机会
- 考虑重构高`Gas`函数



**3.实施优化建议**：

- 根据优化建议逐步改进代码
- 测试优化后的`Gas`消耗
- 验证功能正确性



**4.监控 Gas 趋势**：

- 保存历史报告
- 对比优化前后的`Gas`消耗
- 建立`Gas`消耗基准线



## 十、相关链接

- [Hardhat 文档](https://hardhat.org/docs)
- [OpenZeppelin 合约](https://docs.openzeppelin.com/contracts)
- [Chainlink 文档](https://docs.chain.link/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)



