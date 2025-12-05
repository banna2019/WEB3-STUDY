# MetaStake-Token质押系统

基于区块链的质押系统,支持多种代币的质押,并基于用户质押的代币数量和时间长度分配`MetaNode`代币作为奖励



## 一、项目概述

`MetaStake`是一个去中心化的质押系统,具有以下特性：

- 支持多池质押(`Native currency`和`ERC20`代币)
- 基于权重和时间分配奖励
- 解质押锁定机制
- 可升级合约(使用`UUPS`代理模式)
- 灵活的暂停机制
- 完整的权限管理
- **Uniswap集成** - 支持领取奖励时自动交换成其他代币



## 二、项目结构

```bash
MetaStake-Token/
├── contracts/
│   ├── MetaNodeToken.sol           # MetaNode ERC20代币合约
│   ├── MetaStake.sol               # MetaStake主质押合约
│   ├── interfaces/
│   │   └── IUniswapV2Router02.sol # Uniswap V2 Router接口
│   └── mocks/
│       └── MockUniswapRouter.sol  # Mock Uniswap Router(用于测试)
├── scripts/
│   ├── deploy.js                   # 主部署脚本
│   ├── addPool.js                  # 添加质押池脚本
│   ├── verify.js                   # 合约验证脚本
│   ├── interact.js                 # 合约交互查询脚本
│   ├── setUniswapRouter.js        # 设置Uniswap Router脚本
│   └── testUniswap.js              # Uniswap集成测试脚本
├── test/
│   ├── MetaStake.test.js           # 主测试文件
│   └── UniswapIntegration.test.js # Uniswap集成测试文件
├── deployments/                    # 部署信息目录(自动生成)
├── hardhat.config.js              # Hardhat配置
├── package.json                   # 项目依赖
├── .env.example                   # 环境变量配置模板
└── README.md                      # 项目文档
```



## 三、功能说明

### 3.1.质押功能

用户可以将`Native currency`(`ETH`)或`ERC20`代币质押到指定的池中

- **输入参数**: 池`ID`(`_pid`), 质押数量 (`_amount`)
- **前置条件**: 用户已授权足够的代币给合约(`ERC20`代币)
- **后置条件**: 用户的质押代币数量增加,池中的总质押代币数量更新
- **异常处理**: 质押数量低于最小质押要求时拒绝交易



### 3.2.解除质押功能

用户可以解除质押,但需要等待锁定期结束后才能提取

- **输入参数**: 池`ID`(`_pid`), 解除质押数量 (`_amount`)
- **前置条件**: 用户质押的代币数量足够
- **后置条件**: 用户的质押代币数量减少,解除质押请求记录,等待锁定期结束后可提取
- **异常处理**: 如果解除质押数量大于用户质押的数量,交易失败



### 3.3.领取奖励

用户可以随时领取已累积的`MetaNode`代币奖励

- **输入参数**: 池`ID`(`_pid`)
- **前置条件**: 有可领取的奖励
- **后置条件**: 用户领取其奖励,清除已领取的奖励记录
- **异常处理**: 如果没有可领取的奖励,不执行任何操作



### 3.4.添加和更新质押池

管理员可以添加新的质押池或更新现有池的配置

- **输入参数**: 
  - 质押代币地址 (`_stTokenAddress`)
  - 池权重 (`_poolWeight`)
  - 最小质押金额 (`_minDepositAmount`)
  - 解除质押锁定区块数 (`_unstakeLockedBlocks`)
- **前置条件**: 只有管理员可操作
- **后置条件**: 创建新的质押池或更新现有池的配置



### 3.5.合约升级和暂停

- **升级合约**: 只有持有升级角色的账户可执行
- **暂停/恢复操作**: 可以独立控制质押、解除质押、领奖等操作的暂停和恢复



## 四、数据结构

### 4.1.`Pool`(质押池)

```solidity
struct Pool {
    address stTokenAddress;        // 质押代币地址(address(0)表示native currency)
    uint256 poolWeight;            // 质押池的权重,影响奖励分配
    uint256 lastRewardBlock;       // 最后一次计算奖励的区块号
    uint256 accMetaNodePerST;      // 每个质押代币累积的MetaNode数量(乘以1e18)
    uint256 stTokenAmount;         // 池中的总质押代币量
    uint256 minDepositAmount;      // 最小质押金额
    uint256 unstakeLockedBlocks;   // 解除质押的锁定区块数
}
```



### 4.2.`User`(用户信息)

```solidity
struct User {
    uint256 stAmount;              // 用户质押的代币数量
    uint256 finishedMetaNode;      // 已分配的MetaNode数量
    uint256 pendingMetaNode;       // 待领取的MetaNode数量
    UnstakeRequest[] requests;     // 解质押请求列表
}
```



### 4.3.`UnstakeRequest`(解质押请求)

```solidity
struct UnstakeRequest {
    uint256 amount;                // 解质押数量
    uint256 unlockBlock;           // 解锁区块号
}
```



## 五、安装和运行

### 5.1.安装依赖

```bash
npm install
```



### 5.2.配置环境变量

复制环境变量模板文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件,填入实际值：

```env
# 网络配置（必需）
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key

# 合约地址配置（可选,部署后自动保存到deployments目录）
# 如果手动设置,将覆盖deployments目录中的值
META_NODE_TOKEN_ADDRESS=
META_STAKE_ADDRESS=
IMPLEMENTATION_ADDRESS=

# 部署配置（可选,有默认值）
META_NODE_PER_BLOCK=1                    # 每个区块奖励数量
REWARD_AMOUNT=1000000                    # 初始奖励代币总量
MIN_DEPOSIT=0.1                          # 最小质押金额
UNSTAKE_LOCKED_BLOCKS=100                # 解质押锁定区块数
POOL_WEIGHT=1                            # 池权重

# Uniswap配置（可选）
UNISWAP_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008  # Sepolia Router地址
```

**重要提示**：
- `PRIVATE_KEY` 不要包含 `0x` 前缀
- 永远不要将 `.env` 文件提交到代码仓库
- 确保账户有足够的`ETH`支付`Gas`费用
- **合约地址配置**：
  - 部署后会自动保存到 `deployments/` 目录
  - 如果手动设置环境变量,将优先使用环境变量中的值
  - 留空时,脚本会自动从部署文件中读取



### 5.3.编译合约

```bash
npm run compile
```



### 5.4.运行测试

```bash
npm run test

# 覆盖测试
npm run test:coverage
```



### 5.5.部署到本地网络

```bash
# 启动本地节点
npm run node

# 在另一个终端部署
npm run deploy:local
```



### 5.6.部署到Sepolia测试网

```bash
# 确保.env文件配置正确
npm run deploy:sepolia
```

**部署脚本会自动：**

- 部署`MetaNode`代币合约
- 部署`MetaStake`合约(使用`UUPS`代理)
- 铸造奖励代币到`MetaStake`合约
- 添加第一个`Native currency`质押池
- 如果配置了`UNISWAP_ROUTER`,自动设置`Router`地址
- 保存部署信息到 `deployments/sepolia.json`



### 5.7.添加新的质押池

```bash
npm run add-pool:sepolia
```



### 5.8.设置Uniswap Router(如果部署时未设置)

```bash
export UNISWAP_ROUTER=0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3
npm run set-router:sepolia
```



### 5.9.验证合约

```bash
npm run verify:sepolia
```



### 5.10.查询合约状态

```bash
npm run interact:sepolia
```



### 5.11.测试Uniswap集成

```bash
npm run test-uniswap:sepolia
```



## 六、使用示例

### 6.1.质押ETH

```javascript
const stakeAmount = ethers.parseEther("1");
await metaStake.stake(0, stakeAmount, { value: stakeAmount });
```



### 6.2.质押ERC20代币

```javascript
// 首先授权
await token.approve(metaStakeAddress, amount);

// 然后质押
await metaStake.stake(poolId, amount);
```



### 6.3.解除质押

```javascript
const unstakeAmount = ethers.parseEther("0.5");
await metaStake.unstake(poolId, unstakeAmount);
```



### 6.4.提取已解锁的代币

```javascript
await metaStake.withdraw(poolId);
```



### 6.5.领取奖励

```javascript
await metaStake.claim(poolId);
```



### 6.6.领取并交换奖励(Uniswap)

```javascript
// 交换成ETH
const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期
const estimatedETH = await metaStake.getSwapAmountOut(
  pendingReward,
  ethers.ZeroAddress // ETH
);
await metaStake.claimAndSwap(
  poolId,
  ethers.ZeroAddress, // 输出ETH
  estimatedETH * 90n / 100n, // 允许10%滑点
  deadline
);

// 交换成其他ERC20代币(如USDT)
const usdtAddress = "0x..."; // USDT地址
const estimatedUSDT = await metaStake.getSwapAmountOut(
  pendingReward,
  usdtAddress
);
await metaStake.claimAndSwap(
  poolId,
  usdtAddress,
  estimatedUSDT * 90n / 100n, // 允许10%滑点
  deadline
);
```



### 6.7.查询待领取奖励

```javascript
const pending = await metaStake.pendingReward(poolId, userAddress);
```



## 七、奖励分配机制

奖励分配基于以下公式：

- **1.每个区块的总奖励**: `metaNodePerBlock`
- **2.池的权重比例**: `poolWeight / totalWeight`
- **3.池应得的奖励**: `(blocks * metaNodePerBlock * poolWeight) / totalWeight`
- **4.每个质押代币的累积奖励**: `(poolReward * 1e18) / pool.stTokenAmount`
- **5.用户的奖励**: `(user.stAmount * accMetaNodePerST) / 1e18 - user.finishedMetaNode`



## 八、权限角色

- **DEFAULT_ADMIN_ROLE**: 默认管理员角色,拥有所有权限
- **ADMIN_ROLE**: 管理员角色,可以添加/更新池、设置暂停状态等
- **UPGRADER_ROLE**: 升级角色,可以升级合约



## 九、安全特性

- **1.可升级合约**: 使用`OpenZeppelin`的`UUPS`代理模式
- **2.访问控制**: 使用`OpenZeppelin`的`AccessControl`
- **3.暂停机制**: 可以独立暂停质押、解质押、领奖操作
- **4.重入保护**: 使用`OpenZeppelin`的`SafeERC20`库
- **5.输入验证**: 所有关键操作都有输入验证



## 十、可用脚本命令

| 命令 | 说明 |
|------|------|
| `npm run compile` | 编译合约 |
| `npm test` | 运行所有测试 |
| `npm run test:coverage` | 生成测试覆盖率报告 |
| `npm run node` | 启动本地Hardhat节点 |
| `npm run deploy:local` | 部署到本地网络 |
| `npm run deploy:sepolia` | 部署到Sepolia测试网 |
| `npm run add-pool:sepolia` | 添加新的质押池 |
| `npm run verify:sepolia` | 验证合约代码 |
| `npm run interact:sepolia` | 查询合约状态 |
| `npm run set-router:sepolia` | 设置Uniswap Router |
| `npm run test-uniswap:sepolia` | 测试Uniswap集成 |



## 十一、测试覆盖

测试文件包含以下测试场景：

### 11.1.基础功能测试 (`MetaStake.test.js`)
- 合约部署和初始化
- 池管理(添加、更新)
- 质押功能(Native currency和ERC20)
- 解除质押功能
- 奖励计算和领取
- 提取功能(锁定期)
- 多池奖励分配
- 暂停功能
- 升级功能
- 紧急提取
- 边界情况测试
- 集成测试



### 11.2.Uniswap集成测试(`UniswapIntegration.test.js`)

- `Uniswap Router`配置
- 领取并交换成`ETH`
- 领取并交换成`ERC20`代币
- 预估交换输出
- 错误处理



## 十二Uniswap集成

### 12.1.功能说明

`MetaStake`集成了`Uniswap V2 Router`,允许用户在领取奖励时自动将`MetaNode`代币交换成其他代币：

- **1.交换成ETH**: 将`MetaNode`代币自动交换成`ETH`
- **2.交换成ERC20代币**: 将`MetaNode`代币交换成其他`ERC20`代币(如`USDT`、`USDC`等)
- **3.滑点保护**: 通过`amountOutMin`参数设置最小输出数量,防止滑点过大
- **4.预估输出**: 使用`getSwapAmountOut`函数预估交换后的输出数量



### 12.2.设置Uniswap Router

#### 方法1：部署时自动设置

在 `.env` 文件中设置 `UNISWAP_ROUTER`,部署脚本会自动配置：

```bash
UNISWAP_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
npm run deploy:sepolia
```

#### 方法2：部署后单独设置

```bash
export UNISWAP_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
npm run set-router:sepolia
```

#### 方法3：通过合约调用

```javascript
// 需要管理员权限
await metaStake.setUniswapRouter(routerAddress);
```



### 12.3.Uniswap Router地址

| 网络 | Router地址 |
|------|-----------|
| 主网 (Ethereum) | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` |
| Sepolia测试网 | `0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3` |
| Goerli测试网 | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` |
| Polygon | `0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff` |
| BSC | `0x10ED43C718714eb63d5aA57B78B54704E256024E` |

**注意**: 其他网络的Router地址请查看 [Uniswap官方文档](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/router-02)



### 交换路径

- **MetaNode -> ETH**: `MetaNode -> WETH -> ETH`(自动转换)
- **MetaNode -> ERC20**: `MetaNode -> WETH -> ERC20`



### 12.4.使用示例

#### 1.预估交换输出

```javascript
// 预估交换成ETH
const amountIn = ethers.parseEther("100");
const estimatedETH = await metaStake.getSwapAmountOut(
  amountIn,
  ethers.ZeroAddress // ETH
);
console.log(`预计可获得: ${ethers.formatEther(estimatedETH)} ETH`);

// 预估交换成USDT
const usdtAddress = "0x...";
const estimatedUSDT = await metaStake.getSwapAmountOut(
  amountIn,
  usdtAddress
);
console.log(`预计可获得: ${ethers.formatEther(estimatedUSDT)} USDT`);
```



#### 2.领取并交换成ETH

```javascript
const poolId = 0;
const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期

// 查询待领取奖励
const pendingReward = await metaStake.pendingReward(poolId, userAddress);

// 预估输出
const estimatedETH = await metaStake.getSwapAmountOut(
  pendingReward,
  ethers.ZeroAddress
);

// 设置滑点保护(允许5%滑点)
const amountOutMin = estimatedETH * 95n / 100n;

// 执行交换
const tx = await metaStake.claimAndSwap(
  poolId,
  ethers.ZeroAddress, // 输出ETH
  amountOutMin,
  deadline
);
await tx.wait();
```



#### 3.领取并交换成ERC20代币

```javascript
const poolId = 0;
const usdtAddress = "0x..."; // USDT地址
const deadline = Math.floor(Date.now() / 1000) + 3600;

const pendingReward = await metaStake.pendingReward(poolId, userAddress);
const estimatedUSDT = await metaStake.getSwapAmountOut(
  pendingReward,
  usdtAddress
);
const amountOutMin = estimatedUSDT * 95n / 100n; // 5%滑点保护

const tx = await metaStake.claimAndSwap(
  poolId,
  usdtAddress,
  amountOutMin,
  deadline
);
await tx.wait();
```



### 12.5.注意事项

- **1.滑点保护**: 建议设置合理的滑点(通常5-10%),避免因市场波动导致交易失败
- **2.交易截止时间**: `deadline` 应该设置为未来时间,建议至少1小时后
- **3.Gas费用**: 交换操作需要额外的`Gas`费用,请确保账户有足够的`ETH`
- **4.流动性**: 确保`Uniswap`池中有足够的流动性,否则交换可能失败或滑点过大
- **5.Router配置**: 使用`claimAndSwap`前必须设置`Uniswap Router`地址



## 十三、注意事项

- **1.第一个池**: 第一个质押池使用`Native currency`(`ETH`),后续池可以使用`ERC20`代币
- **2.奖励代币**: 需要提前给`MetaStake`合约铸造足够的`MetaNode`代币作为奖励
- **3.锁定期**: 解除质押后需要等待锁定期(`unstakeLockedBlocks`)才能提取
- **4.权重分配**: 池的权重影响奖励分配,权重越高,该池获得的奖励越多
- **5.Uniswap Router**: 使用`claimAndSwap`功能前,需要先设置`Uniswap Router`地址
- **6.滑点保护**: 建议设置合理的`amountOutMin`值以防止滑点过大
- **7.交易截止时间**: 确保`deadline`参数设置合理,避免交易过期



## 十四、完整部署流程

### 14.1.准备工作

```bash
# 克隆项目
git clone <repository-url>
cd MetaStake-Token

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件,填入实际值
```



### 14.2.部署合约

```bash
# 部署到Sepolia测试网
npm run deploy:sepolia
```

部署完成后,脚本会输出：
- `MetaNode`代币地址
- `MetaStake`合约地址
- 实现合约地址
- 部署信息已保存到 `deployments/sepolia.json`



### 14.3.验证合约(可选)

```bash
npm run verify:sepolia
```



### 14.4.配置Uniswap Router(可选)

如果部署时未设置,可以单独设置：

```bash
export UNISWAP_ROUTER=0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3
npm run set-router:sepolia
```



### 14.5.添加更多质押池

```bash
# 添加ERC20代币池
export META_STAKE_ADDRESS=0x...  # 或从部署文件中读取
export ST_TOKEN_ADDRESS=0x...    # ERC20代币地址
export POOL_WEIGHT=2             # 池权重
export MIN_DEPOSIT=0.1           # 最小质押金额
export UNSTAKE_LOCKED_BLOCKS=100 # 锁定区块数
npm run add-pool:sepolia
```



### 14.6.查询合约状态

```bash
npm run interact:sepolia
```



### 14.7.测试Uniswap集成

```bash
npm run test-uniswap:sepolia
```



## 十五、API参考

### 15.1.主要函数

#### 质押相关

| 函数名 | 说明 | 参数 |
|--------|------|------|
| `stake(uint256 _pid, uint256 _amount)` | 质押代币 | 池ID, 质押数量 |
| `unstake(uint256 _pid, uint256 _amount)` | 解除质押 | 池ID, 解除数量 |
| `withdraw(uint256 _pid)` | 提取已解锁代币 | 池ID |
| `claim(uint256 _pid)` | 领取奖励 | 池ID |
| `claimAndSwap(...)` | 领取并交换奖励 | 见下方详细说明 |



#### 查询相关

| 函数名 | 说明 | 返回值 |
|--------|------|--------|
| `pendingReward(uint256 _pid, address _user)` | 查询待领取奖励 | 奖励数量 |
| `getSwapAmountOut(uint256 _amountIn, address _outputToken)` | 预估交换输出 | 输出数量 |
| `pools(uint256 _pid)` | 查询池信息 | Pool结构 |
| `users(uint256 _pid, address _user)` | 查询用户信息 | User结构 |



#### 管理员函数

| 函数名 | 说明 | 权限 |
|--------|------|------|
| `addPool(...)` | 添加质押池 | ADMIN_ROLE |
| `updatePoolConfig(...)` | 更新池配置 | ADMIN_ROLE |
| `setMetaNodePerBlock(uint256)` | 设置每区块奖励 | ADMIN_ROLE |
| `setUniswapRouter(address)` | 设置Uniswap Router | ADMIN_ROLE |
| `setPauseStatus(PauseType, bool)` | 设置暂停状态 | ADMIN_ROLE |



### 15.2.claimAndSwap函数详解

```solidity
function claimAndSwap(
    uint256 _pid,              // 池ID
    address _outputToken,      // 输出代币地址(address(0)表示ETH)
    uint256 _amountOutMin,     // 最小输出数量(滑点保护)
    uint256 _deadline          // 交易截止时间(Unix时间戳)
) external whenNotPaused
```

**参数说明**：
- `_pid`: 要领取奖励的池`ID`
- `_outputToken`: 
  - `address(0)`: 交换成`ETH`
  - 其他地址: 交换成对应的`ERC20`代币
- `_amountOutMin`: 最小输出数量,用于滑点保护
- `_deadline`: 交易截止时间,必须是未来时间

**返回值**: 无(通过事件返回交换信息)



**事件**:

- `Claimed`: 奖励领取事件
- `ClaimedAndSwapped`: 交换完成事件



## 十六、故障排除

### 16.1.常见问题

#### 1.部署失败：Insufficient funds

**问题**: 账户余额不足支付Gas费用

**解决方案**:
- 确保账户有足够的ETH
- Sepolia测试网可以通过[水龙头](https://sepoliafaucet.com/)获取测试ETH



#### 2.质押失败：Amount below minimum

**问题**: 质押数量低于最小要求

**解决方案**:
- 检查池的最小质押金额：`pools(_pid).minDepositAmount`
- 确保质押数量 >= 最小金额



#### 3.解除质押失败：Insufficient staked amount

**问题**: 解除质押数量超过用户质押数量

**解决方案**:
- 检查用户质押数量：`users(_pid, userAddress).stAmount`
- 确保解除数量 <= 质押数量



#### 4.提取失败：No withdrawable amount

**问题**: 没有可提取的代币(锁定期未到)

**解决方案**:
- 检查解质押请求的解锁区块：`getUserRequest(_pid, userAddress, index).unlockBlock`
- 等待当前区块 >= 解锁区块



#### 5.交换失败：Uniswap router not set

**问题**: 未设置`Uniswap Router`地址

**解决方案**:
```bash
export UNISWAP_ROUTER=0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3
npm run set-router:sepolia
```



#### 6.交换失败：Slippage exceeded

**问题**: 实际输出数量低于最小要求(滑点过大)

**解决方案**:
- 增加滑点容忍度(降低`amountOutMin`)
- 检查`Uniswap`池的流动性
- 等待市场波动减小后再试



#### 7.交换失败：EXPIRED

**问题**: 交易截止时间已过

**解决方案**:
- 设置更长的截止时间(至少1小时后)
- 重新发起交易



### 16.2.调试技巧

- **1.查看合约状态**:

```bash
npm run interact:sepolia
```



- **2.查看交易详情**:

  - 使用`Etherscan`查看交易详情

  - 检查事件日志



**3.测试Uniswap集成**:

```bash
npm run test-uniswap:sepolia
```



**4.查看部署信息**:

```bash
cat deployments/sepolia.json
```



## 十七、安全建议

**1.私钥安全**:

- 永远不要将私钥提交到代码仓库
- 使用环境变量存储私钥
- 生产环境使用硬件钱包或多签钱包

**2.权限管理**:

- 定期审查管理员权限
- 使用多签钱包作为管理员地址
- 限制管理员账户的权限范围



**3.滑点设置**:

- 根据市场波动设置合理的滑点
- 大额交易时使用更小的滑点
- 监控`Uniswap`池的流动性



**4.合约升级**:

- 升级前充分测试
- 使用时间锁机制
- 社区投票决定是否升级



**5.监控**:

- 监控合约的异常交易
- 设置告警机制
- 定期检查合约状态



## 十八、相关链接

- [OpenZeppelin文档](https://docs.openzeppelin.com/)
- [Hardhat文档](https://hardhat.org/docs)
- [Uniswap V2文档](https://docs.uniswap.org/contracts/v2/overview)
- [Etherscan](https://etherscan.io/)

