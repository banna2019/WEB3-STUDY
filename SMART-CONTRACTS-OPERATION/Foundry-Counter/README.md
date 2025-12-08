# Foundry-Counter

基于 Foundry 框架的智能合约项目。

## 一、项目简介

本项目使用 [Foundry](https://book.getfoundry.sh/) 框架开发，Foundry 是一个用 Rust 编写的快速、可移植和模块化的工具包，用于以太坊应用程序开发。

### 包含的示例合约

项目包含一个简单的 **Counter** 合约示例，演示了基本的智能合约功能：
- 1.设置数字 (`setNumber`)
- 2.增加数字 (`increment`)
- 3.减少数字 (`decrement`)
- 4.重置数字 (`reset`)
- 5.获取数字 (`getNumber`)
- 6.完整的事件日志
- 7.完整的测试覆盖


## 二、项目结构

```bash
Foundry-Counter/
├── src/                 # 智能合约源代码
│   └── Counter.sol     # Counter 示例合约(包含增、减、重置等功能)
├── test/               # 测试文件
│   └── Counter.t.sol   # Counter 合约测试(包含单元测试和模糊测试)
├── script/             # 部署脚本
│   ├── BaseScript.s.sol  # 部署脚本基类(统一管理私钥和合约保存)
│   └── Counter.s.sol     # Counter 合约部署脚本(继承 BaseScript)
├── deployments/        # 部署数据保存目录
├── gas-report/         # Gas 快照保存目录
├── test-reports/       # 测试报告保存目录
├── lib/                # 依赖库(Git 子模块)
│   └── forge-std/      # Foundry 标准库
├── foundry.toml        # Foundry 配置文件
├── .gitignore          # Git 忽略文件
├── .gitmodules         # Git 子模块配置
├── .env.example        # 环境变量配置模板
└── README.md           # 项目说明文档
```

## 三、快速开始

### 3.1.前置要求

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (forge, cast, anvil)
- Git

### 3.2.配置本地`.env`
```bash
# 复制本地.env文件
cp -rp .env.example .env


# 修改本地.env文件中的变量信息(根据自身情况进行修改)
vim .env
# 私钥(用于部署合约,请妥善保管,不要提交到代码仓库)
# 注意: PRIVATE_KEY 可以带或不带 0x 前缀，BaseScript 会自动处理
# 例如: PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
# 或者: PRIVATE_KEY="ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
PRIVATE_KEY="your-private-key"

# Etherscan API Key(用于验证合约)
ETHERSCAN_API_KEY="your-etherscan-api-key"

# Sepolia测试网RPC URL
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/your-infura-key"

# 主网RPC URL
# MAINNET_RPC_URL="https://mainnet.infura.io/v3/your-infura-key"

MUMBAI_RPC_URL=""

MNEMONIC="your-mnemonic"

LOCAL_URL="http://127.0.0.1:8545"

FOUNDRY_PROFILE="local"
```


### 3.3.安装依赖

```bash
# 安装 forge-std(如果还没有安装)
forge install foundry-rs/forge-std
```

### 3.4.编译合约

```bash
forge build
```

### 3.5.运行测试

```bash
# 运行所有测试
forge test

# 运行测试并显示 Gas 报告
forge test --gas-report

# 运行测试并生成 Gas 快照
forge snapshot --snap gas-report/gas-snapshot.txt

# 运行测试并输出详细日志
forge test -vvv
```

### 3.6.本地环境运行(anvil)
- **anvil命令**
```bash
# 运行anvil命令
anvil
```

- **记录本地环境中的可用地址和密钥**
```bash
......
Available Accounts
==================

(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000.000000000000000000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000.000000000000000000 ETH)
(2) 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000.000000000000000000 ETH)
(3) 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (10000.000000000000000000 ETH)
(4) 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 (10000.000000000000000000 ETH)
(5) 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc (10000.000000000000000000 ETH)
(6) 0x976EA74026E726554dB657fA54763abd0C3a0aa9 (10000.000000000000000000 ETH)
(7) 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 (10000.000000000000000000 ETH)
(8) 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f (10000.000000000000000000 ETH)
(9) 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 (10000.000000000000000000 ETH)

Private Keys
==================

(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
(2) 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
(3) 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
(4) 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
(5) 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
(6) 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
(7) 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
(8) 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97
(9) 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
......
```


### 3.7.部署合约

#### 方式一：使用 forge script(推荐)

```bash
# 部署到本地 Anvil 网络
forge script script/Counter.s.sol:CounterScript \
    --rpc-url http://127.0.0.1:8545 \
    --broadcast \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 部署到测试网(需要先加载环境变量)
# 使用命令行参数(脚本内部读取不到环境变量也不影响)
source .env  # 仅用于展开 ${PRIVATE_KEY} 和 ${SEPOLIA_RPC_URL}
forge script script/Counter.s.sol:CounterScript \
    --rpc-url ${SEPOLIA_RPC_URL} \
    --broadcast \
    --verify \
    --private-key ${PRIVATE_KEY}
```

#### 方式二：使用 forge create

```bash
# 部署到本地网络
forge create src/Counter.sol:Counter \
    --rpc-url http://127.0.0.1:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 部署到测试网(需要先加载环境变量)
source .env
forge create src/Counter.sol:Counter \
    --rpc-url ${SEPOLIA_RPC_URL} \
    --private-key ${PRIVATE_KEY} \
    --etherscan-api-key ${ETHERSCAN_API_KEY} \
    --verify
```

## 四、常用命令

### 4.1.编译相关

```bash
# 编译所有合约
forge build

# 编译指定合约
forge build --contracts src/Counter.sol

# 清理编译输出
forge clean
```

### 4.2.测试相关

```bash
# 运行所有测试
forge test

# 运行指定测试文件
forge test --match-path test/Counter.t.sol

# 运行指定测试函数
forge test --match-test test_Increment

# 运行测试并显示 Gas 报告
forge test --gas-report

# 运行测试并生成 Gas 快照
forge snapshot

# 比较 Gas 快照差异
forge snapshot --diff
```

### 4.3.部署相关

```bash
# 模拟部署(不实际发送交易)
forge script script/Counter.s.sol:CounterScript --rpc-url http://127.0.0.1:8545

# 实际部署
forge script script/Counter.s.sol:CounterScript --rpc-url http://127.0.0.1:8545 --broadcast

# 部署并验证合约(需要先加载环境变量)
source .env
forge script script/Counter.s.sol:CounterScript \
    --rpc-url ${SEPOLIA_RPC_URL} \
    --broadcast \
    --verify \
    --private-key ${PRIVATE_KEY} \
    --etherscan-api-key ${ETHERSCAN_API_KEY}
```

### 4.4.本地开发网络

```bash
# 启动本地 Anvil 节点
anvil

# 启动 Anvil 并分叉主网
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# 启动 Anvil 并分叉测试网
anvil --fork-url https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

### 4.5.与合约交互(使用cast)

```bash
# 查询合约状态

## 本地环境
cast call <CONTRACT_ADDRESS> "getNumber()" --rpc-url http://127.0.0.1:8545 | cast --to-dec | xargs -I {} cast to-unit {} ether

## Sepolia 测试网络
cast call <CONTRACT_ADDRESS> "getNumber()" --rpc-url ${SEPOLIA_RPC_URL} --private-key ${PRIVATE_KEY} | cast --to-dec | xargs -I {} cast to-unit {} ether

# 发送交易调用合约函数

## 本地环境
cast send <CONTRACT_ADDRESS> "increment()" \
    --rpc-url http://127.0.0.1:8545 \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

## Sepolia 测试网络
cast send <CONTRACT_ADDRESS> "increment()" \
    --rpc-url ${SEPOLIA_RPC_URL} \
    --private-key ${PRIVATE_KEY}

# 查询账户余额

## 本地环境
cast balance <CONTRACT_ADDRESS> --rpc-url http://127.0.0.1:8545 | cast --to-dec | xargs -I {} cast to-unit {} ether

## Sepolia 测试网络
cast balance <CONTRACT_ADDRESS> --rpc-url ${SEPOLIA_RPC_URL} --private-key ${PRIVATE_KEY} | cast --to-dec | xargs -I {} cast to-unit {} ether
```

## 五、Gas 优化

### 5.1.生成 Gas 报告

```bash
# 生成 Gas 快照到指定目录
forge snapshot --snap gas-report/gas-snapshot.txt

# 比较两次 Gas 快照
forge snapshot --diff gas-report/gas-snapshot-old.txt gas-report/gas-snapshot-new.txt
```

### 5.2.查看 Gas 报告

Gas 报告文件保存在 `gas-report/` 目录中，可以通过以下方式查看：

```bash
cat gas-report/gas-snapshot.txt
```

## 六、环境变量配置

项目包含 `.env.example` 文件作为环境变量配置模板。要配置环境变量，请按以下步骤操作：

1. 复制 `.env.example` 文件为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的实际配置值：
   - `PRIVATE_KEY`: 你的私钥(用于部署合约)
   - `ETHERSCAN_API_KEY`: Etherscan API Key(用于验证合约)
   - `SEPOLIA_RPC_URL`: Sepolia 测试网 RPC URL
   - `MUMBAI_RPC_URL`: Mumbai 测试网 RPC URL(可选)
   - `MNEMONIC`: 助记词(可选)
   - `LOCAL_URL`: 本地网络 URL(默认: http://127.0.0.1:8545)
   - `FOUNDRY_PROFILE`: Foundry 配置文件名(默认: local)

**重要提示**:
- **不要将 `.env` 文件提交到代码仓库**(已在 `.gitignore` 中忽略)
- 可以将 `.env.example` 提交到仓库作为配置模板
- 请妥善保管你的私钥和助记词，不要泄露给他人

**重要提示**: Foundry **不会自动加载** `.env` 文件！


### 6.1.关于 `foundry.toml` 中的环境变量

`foundry.toml` 支持环境变量替换(如 `\${SEPOLIA_RPC_URL}`)，但**这不会让脚本中的 `vm.envUint()` 自动读取到这些变量**。

**区别**：
- `foundry.toml` 中的 `\${VAR}`：用于配置 Foundry 工具本身(RPC endpoints、Etherscan keys 等)，在读取配置文件时进行替换
- `vm.envUint("VAR")`：从脚本执行时的进程环境变量中读取，需要环境变量在进程环境中存在

**示例**：
```toml
# foundry.toml
[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"  # Foundry 读取配置时替换

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }  # Foundry 读取配置时替换
```

即使 `foundry.toml` 中使用了 `\${PRIVATE_KEY}`，脚本中的 `vm.envUint("PRIVATE_KEY")` 仍然需要环境变量在进程环境中存在。


### 6.2.让 `vm.envUint()` 读取环境变量的方法

`vm.envUint()` 从进程的环境变量中读取。要让脚本能读取到环境变量，有以下几种方法：


#### 方式一：导出环境变量(推荐，确保子进程继承)

使用 `export` 导出环境变量，确保 `forge script` 进程能继承，这样脚本内部的 `vm.envUint()` 就能读取到：

```bash
# 方法 1a: 手动导出每个变量
export PRIVATE_KEY=your-private-key
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-key
export ETHERSCAN_API_KEY=your-api-key

# 然后运行部署命令(脚本内部的 vm.envUint() 可以读取到)
forge script script/Counter.s.sol:CounterScript \
    --rpc-url ${SEPOLIA_RPC_URL} \
    --broadcast \
    --verify
```

**注意**: `source .env` 只在当前 shell 中设置变量，不会导出给子进程。必须使用 `export` 才能让 `forge script` 进程继承环境变量。

#### 方式二：使用命令行参数(不依赖环境变量)

如果使用 `--private-key` 参数，脚本内部的 `vm.envUint()` 读取失败也不影响部署：

```bash
source .env  # 仅用于展开 ${PRIVATE_KEY}
forge script script/Counter.s.sol:CounterScript \
    --rpc-url ${SEPOLIA_RPC_URL} \
    --broadcast \
    --verify \
    --private-key ${PRIVATE_KEY}
```

**注意**: 
- `source .env` 只在当前 shell 中设置变量，不会导出给子进程
- `vm.envUint()` 需要环境变量在 `forge script` 进程的环境中
- 使用 `--env-file` 是最可靠的方法

## 七、学习资源

- [Foundry 官方文档](https://book.getfoundry.sh/)
- [Foundry GitHub](https://github.com/foundry-rs/foundry)
- [Solidity 官方文档](https://docs.soliditylang.org/)

## 八、许可证

本项目采用 MIT 许可证。

## 九、贡献

欢迎提交 Issue 和 Pull Request！

---

**Happy Coding!**
