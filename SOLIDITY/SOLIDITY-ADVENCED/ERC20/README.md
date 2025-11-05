# `ERC20`代币合约项目

基于`Hardhat`的`ERC20`代币智能合约项目,实现了标准`ERC20`代币功能.



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

编辑 `.env` 文件,设置以下变量：

**必需变量:**
- `PRIVATE_KEY`: 你的钱包私钥(用于部署合约)
- `INFURA_PROJECT_ID`: Infura Project ID(用于连接 Sepolia 测试网络)
- `ETHERSCAN_API_KEY`: Etherscan API Key(用于验证合约)

**可选变量(代币配置):**
- `TOKEN_NAME`: 代币名称(默认: "My Token")
- `TOKEN_SYMBOL`: 代币符号(默认: "MTK")
- `TOKEN_DECIMALS`: 代币精度(默认: 18)
- `TOKEN_INITIAL_SUPPLY`: 初始供应量(默认: 1000000)

**可选变量(合约验证):**
- `CONTRACT_ADDRESS`: 合约地址(用于 verify:contract 脚本)
  - **注意**: 此变量会在部署成功后自动写入 `.env` 文件,无需手动设置
  - 部署脚本会自动更新或添加此变量



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

# 只运行 ERC20Token 合约测试
npm test test/ERC20Token.js
```



#### 6.部署合约

```bash
npm run deploy:sepolia
```

部署脚本会自动部署`ERC20Token`合约,并显示合约地址和代币信息.

**部署后自动保存合约地址:**
部署成功后,脚本会自动将合约地址保存到 `.env` 文件中的 `CONTRACT_ADDRESS` 变量,后续可以直接使用 `npm run verify:contract` 验证合约,无需手动设置地址.

**自定义代币参数:**
在 `.env` 文件中设置以下变量可以自定义代币参数(如果不设置则使用默认值):
```bash
TOKEN_NAME=My Custom Token
TOKEN_SYMBOL=MCT
TOKEN_DECIMALS=18
TOKEN_INITIAL_SUPPLY=1000000
```

部署脚本会显示每个参数是从环境变量读取还是使用默认值.



#### 7.验证合约

```bash
# 方法 1: 使用环境变量 + verify:contract
# 在 .env 文件中设置:
# CONTRACT_ADDRESS=xxxxxx
# TOKEN_NAME=xxxxxx
# TOKEN_SYMBOL=xxxxxx
# TOKEN_DECIMALS=18
# TOKEN_INITIAL_SUPPLY=1000000
npm run verify:contract


# 方法 2: 使用 verify:direct (推荐,最简单)
npm run verify:direct -- <合约地址> "My Token" "MTK" 18 1000000

# 方法 3: 直接使用 Hardhat
npx hardhat verify --network sepolia <合约地址> "My Token" "MTK" 18 1000000
```

**注意事项：**
- 使用 `npm run` 时,必须在命令和参数之间添加 `--` 分隔符
- 确保已设置 `ETHERSCAN_API_KEY` 环境变量
- 合约必须已部署到`Sepolia`网络
- 等待几个区块确认后再验证(通常部署后等待 5 个区块)
- `ERC20Token`合约的构造函数参数顺序: `name` `symbol` `decimals` `initialSupply`
- **重要**: `hardhat run` 命令不支持位置参数,因此 `verify:contract` 需要通过环境变量传递合约地址
- **推荐**: 使用 `verify:direct` 方法,最简单直接



### 二、项目结构

```bash
.
├── contracts/              # Solidity 合约文件
│   ├── ERC20Token.sol      # ERC20 代币合约(主合约)
│   └── HelloWorld.sol      # 示例合约
├── contract/               # 合约文件(备用目录)
│   └── ERC20Token.sol      # ERC20 代币合约
├── test/                   # 测试文件
│   ├── ERC20Token.js       # ERC20Token 合约自动化测试(包含40+测试用例)
│   └── HelloWorld.js       # HelloWorld 合约测试
├── scripts/                # 部署和工具脚本
│   ├── deploy.js           # 部署脚本(包含 ERC20Token 合约部署)
│   ├── verify-contract.js  # 验证合约脚本
│   └── check-config.js     # 检查环境配置脚本
├── hardhat.config.js       # Hardhat 配置文件
└── package.json            # 项目依赖配置
```



### 三、`ERC20Token`合约文档

### 3.1.合约概述

`ERC20Token` 是一个实现标准`ERC20`代币接口的智能合约,支持代币转账、授权和增发功能.



### 3.2.主要功能

##### 1.标准`ERC20`功能

- **`balanceOf(address account)`** - 查询账户余额
  - 返回指定地址的代币余额
  - 通过 public mapping 自动生成 getter 函数

- **`transfer(address to, uint256 value)`** - 转账代币
  - 从调用者地址转账指定金额到目标地址
  - 要求：目标地址不能为零地址,余额必须充足
  - 触发 `Transfer` 事件

- **`approve(address spender, uint256 value)`** - 授权其他地址使用代币
  - 允许 `spender` 从调用者地址转账最多 `value` 数量的代币
  - 要求：被授权者地址不能为零地址
  - 触发 `Approval` 事件

- **`transferFrom(address from, address to, uint256 value)`** - 从授权账户转账
  - 允许被授权者从授权账户转账代币到目标地址
  - 要求：授权者和接收者不能为零地址,授权余额和账户余额必须充足
  - 自动减少授权金额
  - 触发 `Transfer` 事件

##### 2.代币管理功能

- **`mint(address to, uint256 value)`** - 增发代币(仅所有者)
  - 只有合约所有者可以调用
  - 向指定地址增发代币,同时增加总供应量
  - 触发 `Mint` 和 `Transfer` 事件



##### 3.代币信息

- **`name`** - 代币名称(string)
- **`symbol`** - 代币符号(string)
- **`decimals`** - 代币精度(uint8,通常为 18)
- **`totalSupply`** - 总供应量(uint256)
- **`owner`** - 合约所有者地址(address)



#### 3.3.事件

- **`Transfer(address indexed from, address indexed to, uint256 value)`**
  - 当发生代币转账时触发
  - `from` 为 `address(0)` 时表示增发代币

- **`Approval(address indexed owner, address indexed spender, uint256 value)`**
  - 当授权操作发生时触发

- **`Mint(address indexed to, uint256 value)`**
  - 当增发代币时触发



#### 3.4.构造函数参数

```solidity
constructor(
    string memory _name,        // 代币名称,如 "My Token"
    string memory _symbol,       // 代币符号,如 "MTK"
    uint8 _decimals,             // 代币精度,通常为 18
    uint256 _initialSupply       // 初始供应量(注意：最终供应量 = _initialSupply * 10^_decimals)
)
```



#### 3.5.使用示例

##### 部署合约

```javascript
const ERC20Token = await ethers.getContractFactory("ERC20Token");
const token = await ERC20Token.deploy(
  "My Token",    // 名称
  "MTK",         // 符号
  18,            // 精度
  1000000        // 初始供应量(100万)
);
```



##### 转账代币

```javascript
// 转账 100 个代币(考虑精度)
await token.transfer(recipientAddress, ethers.parseEther("100"));
```



##### 授权和转账

```javascript
// 1. 授权
await token.approve(spenderAddress, ethers.parseEther("1000"));

// 2. 被授权者从授权账户转账
await token.connect(spender).transferFrom(
  ownerAddress,
  recipientAddress,
  ethers.parseEther("500")
);
```



##### 增发代币(仅所有者)

```javascript
await token.connect(owner).mint(
  recipientAddress,
  ethers.parseEther("10000")
);
```



#### 3.6.测试覆盖

测试文件 `test/ERC20Token.js` 包含以下测试场景:

- **1.部署测试** - 验证合约初始化参数
- **2.transfer 功能测试** - 转账、余额更新、错误处理
- **3.approve 功能测试** - 授权、更新授权、错误处理
- **4.transferFrom 功能测试** - 授权转账、授权金额更新、错误处理
- **5.mint 功能测试** - 增发、权限控制、错误处理
- **6.边界情况测试** - 零金额、大金额、完整余额转账
- **7.综合场景测试** - 完整的转账流程、增发和转账组合



### 四、安全特性

- 防止零地址转账和授权
- 余额和授权金额验证
- 所有者权限控制(mint 功能)
- 标准 ERC20 接口实现
- 事件记录所有重要操作



### 五、导入到钱包

部署到 Sepolia 测试网络后,可以将代币导入到 MetaMask 或其他钱包：

1. 复制合约地址
2. 在钱包中添加自定义代币
3. 输入合约地址、代币符号和精度
4. 即可查看和交易代币



### 六、`Gas`消耗估算

- 部署合约：~1,500,000 gas
- `transfer`：~65,000 gas
- `approve`：~46,000 gas
- `transferFrom`：~75,000 gas
- `mint`：~56,000 gas

