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

编辑 `.env` 文件，设置以下变量：
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
│   ├── MergeSortedArrays.sol         # 合并有序数组合约（主合约）
│   └── HelloWorld.sol                 # 示例合约
├── test/                              # 测试文件
│   ├── MergeSortedArrays.js          # MergeSortedArrays 合约自动化测试
│   └── HelloWorld.js                  # HelloWorld 合约测试
├── scripts/                           # 部署和工具脚本
│   ├── deploy.js                      # 部署脚本（包含 MergeSortedArrays 合约部署）
│   ├── test-merge-sorted-arrays.js   # MergeSortedArrays 合约交互式测试脚本
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
- `contracts/MergeSortedArrays.sol` - 合并有序数组合约，包含以下功能：
  - `mergeSortedArrays()` - 合并两个有序数组（使用双指针算法）
  - `mergeMultipleArrays()` - 合并多个有序数组（使用分治法）
  - `isSorted()` - 验证数组是否已排序（升序）
  - `getMergedLength()` - 获取合并后的数组长度
  - `getMaxValue()` - 查找合并后数组中的最大值
  - `getMinValue()` - 查找合并后数组中的最小值

**测试文件：**
- `test/MergeSortedArrays.js` - 完整的自动化测试套件，包含：
  - 基本合并功能测试（非空数组、重叠元素、重复元素）
  - 边界情况测试（空数组、单个元素、不同长度）
  - 批量合并测试（多个数组、奇数个数组）
  - 排序验证测试
  - 辅助函数测试（长度、最大值、最小值）
  - 一致性测试

**部署脚本：**
- `scripts/deploy.js` - 部署 MergeSortedArrays 合约到 Sepolia 测试网络
- `scripts/test-merge-sorted-arrays.js` - 交互式测试脚本，用于本地测试

**工具脚本：**
- `scripts/verify-contract.js` - 验证合约到 Etherscan
- `scripts/check-config.js` - 检查环境配置是否正确

