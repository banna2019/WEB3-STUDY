# SHIB Meme代币合约项目

一个功能完整的`SHIB`风格`Meme`代币智能合约项目,包含代币税、流动性池集成、交易限制和黑名单/白名单功能.支持自动部署、自动验证、自动保存部署信息等功能.



## 一、目录

- [项目特性](#项目特性)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [部署流程](#部署流程)
- [脚本说明](#脚本说明)
- [合约功能](#合约功能)
- [项目结构](#项目结构)
- [常见问题](#常见问题)
- [文档资源](#文档资源)
- [安全特性](#安全特性)
- [许可证](#许可证)



## 二、项目特性

### 1.代币税功能
- 可配置的交易税率(最高 20%)
- 税费自动分配给指定地址
- 白名单地址免税
- 支持动态调整税率和接收地址
- 税费计算和转账自动化处理



### 2.流动性池集成

- 与`Uniswap V2`完全集成
- 支持添加流动性(代币 + `ETH`)
- 支持移除流动性
- 自动创建或获取交易对(`Pair`)
- 自动流动性注入功能
- 滑点保护机制(5%)



### 3.交易限制功能

- 单笔交易最大额度限制
- 每日交易次数限制
- 24小时自动重置机制
- 可动态调整限制参数
- 灵活的启用/禁用控制



### 4.黑名单/白名单功能

- 黑名单地址禁止转账
- 白名单地址免税
- 支持单个和批量更新
- 灵活的权限管理



### 5.自动化部署功能

- 自动更新 `.env` 文件中的合约地址
- 自动设置`Uniswap Router`和`Factory`
- 自动创建交易对(可选)
- 自动获取`WETH`地址并更新到 `.env`
- 自动验证合约源代码(可选)
- 自动保存部署信息为`Markdown`文件



### 6.信息记录功能

- 部署信息自动保存到 `deployment-version-info` 目录
- 流动性初始化信息自动保存
- `Pair`地址查询信息自动保存
- 所有信息以`Markdown`格式保存,便于查阅



## 三、快速开始

### 3.1.环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0
- Hardhat >= 2.19.0



### 3.2.安装依赖

```bash
npm install
```



### 3.3.配置环境变量

- 1.**复制环境变量模板文件**

```bash
cp .env.example .env
```

- **2.编辑 `.env` 文件,填写实际配置(详见[环境配置](#环境配置)章节)**



### 3.4.编译合约

```bash
npm run compile
```



### 3.5.运行测试

```bash
npm test
```

测试完成后会输出`Gas`消耗汇总报告.



## 四、环境配置

### 4.1.必需配置

- **在 `.env` 文件中配置以下参数**

```env
# 代币基本信息
TOKEN_NAME=Shiba Inu
TOKEN_SYMBOL=SHIB
TOKEN_TOTAL_SUPPLY=1000000000

# 代币税配置
TAX_RATE=500                    # 税率(基点,500 = 5%)
TAX_RECEIVER=0x...              # 税收接收地址(可选,默认使用部署者地址)

# 网络配置
PRIVATE_KEY=your_private_key    # 部署账户私钥
SEPOLIA_RPC_URL=https://...    # Sepolia 测试网 RPC URL
MAINNET_RPC_URL=https://...    # 主网 RPC URL(可选)

# Uniswap V2 配置
UNISWAP_V2_ROUTER=0x...         # Uniswap V2 Router 地址
UNISWAP_V2_FACTORY=             # Factory 地址(可选,会自动获取)
AUTO_CREATE_PAIR=false          # 是否自动创建交易对
```



### 4.2.可选配置

```env
# 合约验证
ETHERSCAN_API_KEY=your_api_key  # Etherscan API Key
AUTO_VERIFY=false               # 是否自动验证合约

# 流动性初始化(部署后使用)
CONTRACT_ADDRESS=               # 合约地址(部署脚本会自动填充)
INITIAL_TOKEN_AMOUNT=1000000   # 初始代币数量
INITIAL_ETH_AMOUNT=1           # 初始 ETH 数量

# 通用配置
ZERO_ADDRESS=0x0000000000000000000000000000000000000000
```



### 4.3.网络地址参考

#### A.`Uniswap V2 Router`地址
- **主网**: `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`
- **Sepolia**: `0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3`



#### B.`Uniswap V2 Factory`地址(可选)

- **主网**: `0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f`
- **Sepolia**: `0xF62c03E08ada871A0bEb309762E260a7a6a880E6`

**注意**：如果不设置 `UNISWAP_V2_FACTORY`,部署脚本会通过`Router`自动获取.



## 五、部署流程

### 5.1.完整部署流程

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 编译合约
npm run compile

# 4. 运行测试(可选)
npm test

# 5. 部署合约
npm run deploy:sepolia  # 或 deploy:mainnet

# 6. 初始化流动性(使代币在 Uniswap 上可见)
npm run init-liquidity:sepolia  # 或 init-liquidity:mainnet

# 7. 查询 Pair 地址(可选)
npm run get-pair:sepolia  # 或 get-pair:mainnet
```



### 5.2.部署脚本功能

部署脚本(`deploy-shib.js`)会自动完成以下操作:

- **1.部署合约**：部署`SHIB`代币合约
- **2.更新 .env**：自动更新 `CONTRACT_ADDRESS`
- **3.设置 Router**：如果配置了 `UNISWAP_V2_ROUTER`,自动设置
- **4.设置 Factory**：优先使用 `.env` 中的 `UNISWAP_V2_FACTORY`,否则自动获取
- **5.获取WETH**：自动获取`WETH`地址并更新到 `.env`
- **6.创建交易对**：如果设置了 `AUTO_CREATE_PAIR=true`,自动创建
- **7.更新Pair地址**：如果创建了交易对,自动更新 `UNISWAP_V2_PAIR`
- **8.验证合约**：如果设置了 `AUTO_VERIFY=true`,自动验证
- **9.保存信息**：所有部署信息保存到 `deployment-version-info` 目录



### 5.3.部署输出

部署完成后会输出：
- 合约地址和`Etherscan`链接
- 代币信息(名称、符号、总供应量、税率等)
- `Uniswap`信息(`Router`、`Factory`、`WETH`、`Pair`地址)
- 环境变量更新说明
- 部署信息文件路径



## 六、脚本说明

### 6.1.部署脚本

#### A.`deploy-shib.js`

部署`SHIB`代币合约到指定网络.

- **使用方法：**

```bash
npm run deploy:local      # 本地网络
npm run deploy:sepolia    # Sepolia 测试网
npm run deploy:mainnet    # 主网
```

- **功能：**
  - 部署合约
  - 自动更新 `.env` 文件
  - 自动设置`Uniswap Router`和`Factory`
  - 自动创建交易对(可选)
  - 自动验证合约(可选)
  - 保存部署信息为`Markdown`文件
- **输出文件：**
  - `deployment-version-info/{TOKEN_SYMBOL}-deployment-{时间戳}.md`




### 6.2.流动性初始化脚本

#### A.`init-liquidity.js`

初始化流动性,使代币在`Uniswap`上可见.

- **使用方法：**

```bash
npm run init-liquidity:local      # 本地网络
npm run init-liquidity:sepolia    # Sepolia 测试网
npm run init-liquidity:mainnet    # 主网
```

- **功能：**
  - 检查并设置`Router`(如果未设置)
  - 创建交易对(如果未创建)
  - 授权合约使用代币
  - 添加初始流动性
  - 保存初始化信息为`Markdown`文件
- **环境变量要求：**
  - `CONTRACT_ADDRESS`：合约地址(部署脚本会自动填充)
  - `INITIAL_TOKEN_AMOUNT`：初始代币数量
  - `INITIAL_ETH_AMOUNT`：初始`ETH`数量
  - `UNISWAP_V2_ROUTER`：`Router`地址(如果未在合约中设置
- **输出文件：**
  - `deployment-version-info/{TOKEN_SYMBOL}-init-liquidity-{时间戳}.md`




### 6.3.`Pair`地址查询脚本

#### A.`get-pair-address.js`

查询`Uniswap Pair`地址和相关信息.

- **使用方法：**

```bash
npm run get-pair:local      # 本地网络
npm run get-pair:sepolia    # Sepolia 测试网
npm run get-pair:mainnet    # 主网
```

- **功能：**
  - 从`Uniswap Factory`查询`Pair`地址
  - 从代币合约查询`Pair`地址
  - 检查`Pair`流动性状态
  - 验证地址一致性
  - 保存查询信息为`Markdown`文件
- **环境变量要求：**
  - `CONTRACT_ADDRESS` 或 `TOKEN_ADDRESS`：代币合约地址
  - `UNISWAP_V2_ROUTER`：Router 地址
- **输出文件：**
  - `deployment-version-info/{TOKEN_SYMBOL}-get-pair-address-{时间戳}.md`



### 6.4.合约验证脚本

#### A.手动验证

如果自动验证失败,可以使用以下命令手动验证：

```bash
# Sepolia 测试网
npm run verify:sepolia <合约地址> "代币名称" "代币符号" <总供应量> <税率> <税收接收地址>

# 主网
npm run verify:mainnet <合约地址> "代币名称" "代币符号" <总供应量> <税率> <税收接收地址>
```

**示例：**

```bash
npm run verify:sepolia 0x1234... "Shiba Inu" "SHIB" 1000000000 500 0xabcd...
```



## 七、合约功能

### 7.1.代币税相关

- `setTaxRate(uint256 newRate, address receiver)` - 设置税率和接收地址
- `calculateTax(uint256 amount, address from, address to)` - 计算税费
- `taxRate()` - 查询当前税率
- `taxReceiver()` - 查询税收接收地址
- `taxEnabled()` - 查询税收是否启用



### 7.2.交易限制相关

- `setTransactionLimits(uint256 maxAmount, uint256 maxDaily)` - 设置交易限制
- `maxTransactionAmount()` - 查询单笔最大额度
- `maxDailyTransactions()` - 查询每日最大次数
- `getDailyTransactionCount(address account)` - 查询地址的每日交易次数



### 7.3.流动性池相关

- `setUniswapV2Factory(address factory)` - 设置`Factory`地址
- `setUniswapV2Router(address router)` - 设置`Router`地址(自动获取`Factory`)
- `setUniswapV2Pair(address pair)` - 设置`Pair`地址
- `createOrGetPair()` - 创建或获取交易对
- `addLiquidity(...)` - 添加流动性
- `removeLiquidity(...)` - 移除流动性
- `setAutoLiquidity(bool enabled, uint256 threshold)` - 设置自动流动性注入
- `triggerAutoLiquidity()` - 触发自动流动性注入



### 7.4.黑名单/白名单相关

- `updateBlacklist(address account, bool isBlacklisted)` - 更新黑名单
- `updateBlacklistBatch(address[] accounts, bool isBlacklisted)` - 批量更新黑名单
- `updateWhitelist(address account, bool isWhitelisted)` - 更新白名单
- `updateWhitelistBatch(address[] accounts, bool isWhitelisted)` - 批量更新白名单



## 八、项目结构

```bash
Shib/
├── contracts/                      # 合约源码
│   ├── SHIB.sol                   # 主合约
│   ├── interfaces/                # 接口定义
│   │   ├── IUniswapV2Router02.sol
│   │   ├── IUniswapV2Factory.sol
│   │   └── IUniswapV2Pair.sol
│   └── mocks/                     # Mock 合约(仅用于测试)
│       └── MockUniswapV2Router.sol
├── scripts/                       # 部署和工具脚本
│   ├── deploy-shib.js            # 部署脚本
│   ├── init-liquidity.js         # 流动性初始化脚本
│   └── get-pair-address.js       # Pair 地址查询脚本
├── test/                          # 测试文件
│   └── SHIB.test.js              # 完整测试套件
├── deployment-version-info/       # 部署信息记录(自动生成)
│   ├── {TOKEN_SYMBOL}-deployment-{时间戳}.md
│   ├── {TOKEN_SYMBOL}-init-liquidity-{时间戳}.md
│   └── {TOKEN_SYMBOL}-get-pair-address-{时间戳}.md
├── .env.example                   # 环境变量模板
├── hardhat.config.js              # Hardhat 配置
├── package.json                   # 项目依赖
└── README.md                      # 项目文档(本文件)
```



## 九、常见问题

### 9.1.为什么代币在钱包中被隐藏？

新创建的代币在钱包界面中可能被自动放入"隐藏的代币"部分.

**原因：**

- 没有价格信息(未在价格数据源中注册)
- 没有流动性或流动性不足
- 交易量不足
- 索引延迟(24-48 小时)

**解决方案：**
- 1.运行 `npm run init-liquidity:sepolia` 添加流动性
- 2.在 Uniswap 上进行几笔交易
- 3.等待 24-48 小时让价格数据源更新
- 4.在钱包中手动添加代币



### 9.2.为什么钱包中有交易信息但搜索不到？

代币已经在`Uniswap`钱包中显示,但仍然无法在搜索功能中找到.

**原因：**
- **钱包显示**：基于链上数据(交易历史)
- **搜索功能**：基于代币列表和索引数据



**解决方案：**

- **1.使用合约地址直接访问**(最快)：

  ```bash
  https://app.uniswap.org/#/swap?inputCurrency=你的合约地址
  ```

  

- **2.添加到代币列表**：提交到[Uniswap Default Token List](https://github.com/Uniswap/default-token-list)

- **3.增加交易量**：进行 10-20 笔交易

- **4.等待索引更新**：24-48 小时



### 9.3.`Factory`地址需要手动设置吗？

**不需要**.部署脚本会自动通过`Router`获取`Factory`地址.

**工作流程：**
- 1.如果 `.env` 中设置了 `UNISWAP_V2_FACTORY`,优先使用手动设置的地址
- 2.如果未设置,`setUniswapV2Router()` 会自动通过 `router.factory()` 获取
- 3.`Factory`地址会自动保存到合约中

**建议：** 通常不需要手动设置,除非需要修正`Factory`地址.



### 9.4.`WETH`地址需要手动设置吗？

**不需要**.`WETH`地址会自动通过`Router`获取并更新到 `.env` 文件.

**说明：**
- `WETH`(`Wrapped ETH`)是`ETH`的`ERC20`包装版本
- 不同网络有不同的`WETH`地址
- `Router`合约会自动返回对应网络的`WETH`地址
- 部署脚本会自动获取并更新到 `.env` 文件



### 9.5.`Pair`地址是自动创建还是需要手动设置？

**自动创建**(推荐).

**工作流程：**

- 1.部署时如果设置了 `AUTO_CREATE_PAIR=true`,会自动创建交易对
- 2.运行 `init-liquidity.js` 时,如果交易对不存在,会自动创建
- 3.也可以手动调用 `shib.createOrGetPair()` 创建

**查询`Pair`地址：**

```bash
npm run get-pair:sepolia
```



### 9.6.部署脚本超时怎么办？

如果遇到网络超时问题：

**解决方案：**

- 1.检查网络连接和`RPC`节点是否正常
- 2.增加`RPC`节点的超时时间
- 3.使用更稳定的`RPC`服务(如`Infura`、`Alchemy`)
- 4.脚本已内置重试机制,会自动重试3次



### 9.7.`Mock`合约会被部署到链上吗？

**不会**.`Mock`合约仅用于测试,不会被部署到真实网络.

- `Mock`合约会被编译(生成`artifacts`)
- `Mock`合约不会被部署到测试网/主网
- `Mock`合约只在运行 `npm test` 时在本地测试网络使用



## 十、安全特性

- **重入攻击防护**：使用 `ReentrancyGuard` 保护所有流动性操作
- **权限控制**：使用 `Ownable` 实现管理员权限控制
- **参数验证**：完整的参数验证和错误处理
- **滑点保护**：流动性操作包含滑点保护机制
- **交易截止时间**：所有流动性操作检查截止时间
- **黑名单保护**：黑名单地址无法进行转账
- **`OpenZeppelin`标准**：基于`OpenZeppelin Contracts v5.0`



## 十一、部署信息记录

所有部署、流动性初始化和`Pair`查询操作都会自动保存信息到 `deployment-version-info/` 目录：

- **部署信息**：`{TOKEN_SYMBOL}-deployment-{时间戳}.md`
- **流动性初始化**：`{TOKEN_SYMBOL}-init-liquidity-{时间戳}.md`
- **`Pair`查询**：`{TOKEN_SYMBOL}-get-pair-address-{时间戳}.md`

每个`Markdown`文件包含：
- 操作时间和网络信息
- 合约地址和参数
- `Uniswap`配置信息
- 交易哈希和`Gas`消耗
- `Etherscan`链接
- 使用说明和后续操作建议



## 十二、测试

- **运行完整测试套件:**

```bash
npm test
```



**测试包括:**

- 代币部署和基本功能测试
- 代币税功能测试
- 交易限制功能测试
- 流动性池操作测试
- 黑名单/白名单功能测试
- `Gas`消耗汇总报告

