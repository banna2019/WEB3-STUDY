# `NFT`合约项目

基于`Hardhat`的`ERC721` `NFT`智能合约项目,实现了标准`ERC721` `NFT`功能.



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

**可选变量(NFT 配置):**
- `NFT_NAME`: NFT 集合名称(默认: "My NFT Collection")
- `NFT_SYMBOL`: NFT 集合符号(默认: "MNFT")

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

# 只运行 MyNFT 合约测试
npm test test/MyNFT.js
```



#### 6.部署合约

```bash
npm run deploy:sepolia
```

部署脚本会自动部署`MyNFT`合约,并显示合约地址和 NFT 信息.

**部署后自动保存合约地址:**
部署成功后,脚本会自动将合约地址保存到 `.env` 文件中的 `CONTRACT_ADDRESS` 变量,后续可以直接使用 `npm run verify:contract` 验证合约,无需手动设置地址.

**自定义 NFT 参数:**
在 `.env` 文件中设置以下变量可以自定义 NFT 参数(如果不设置则使用默认值):

```bash
NFT_NAME=My Custom NFT Collection
NFT_SYMBOL=MNFT
```

部署脚本会显示每个参数是从环境变量读取还是使用默认值.



#### 7.验证合约

```bash
# 方法 1: 使用环境变量 + verify:contract
# 在 .env 文件中设置:
# CONTRACT_ADDRESS=xxxxxx
# NFT_NAME=xxxxxx
# NFT_SYMBOL=xxxxxx
npm run verify:contract


# 方法 2: 使用 verify:direct (推荐,最简单)
npm run verify:direct -- <合约地址> "My NFT Collection" "MNFT"

# 方法 3: 直接使用 Hardhat
npx hardhat verify --network sepolia <合约地址> "My NFT Collection" "MNFT"
```

**注意事项：**
- 使用 `npm run` 时,必须在命令和参数之间添加 `--` 分隔符
- 确保已设置 `ETHERSCAN_API_KEY` 环境变量
- 合约必须已部署到`Sepolia`网络
- 等待几个区块确认后再验证(通常部署后等待 5 个区块)
- `MyNFT`合约的构造函数参数顺序: `name` `symbol`
- **重要**: `hardhat run` 命令不支持位置参数,因此 `verify:contract` 需要通过环境变量传递合约地址
- **推荐**: 使用 `verify:direct` 方法,最简单直接



### 二、项目结构

```bash
.
├── contracts/              # Solidity 合约文件
│   ├── MyNFT.sol           # ERC721 NFT 合约(主合约)
│   └── HelloWorld.sol      # 示例合约
├── contract/                # 合约文件(备用目录)
│   └── MyNFT.sol           # ERC721 NFT 合约
├── test/                    # 测试文件
│   ├── MyNFT.js            # MyNFT 合约自动化测试(包含40+测试用例)
│   └── HelloWorld.js       # HelloWorld 合约测试
├── scripts/                 # 部署和工具脚本
│   ├── deploy.js           # 部署脚本(包含 MyNFT 合约部署)
│   ├── verify-contract.js  # 验证合约脚本
│   └── check-config.js     # 检查环境配置脚本
├── hardhat.config.js        # Hardhat 配置文件
└── package.json             # 项目依赖配置
```



### 三、`MyNFT`合约文档

#### 3.1.合约概述

`MyNFT` 是一个实现标准`ERC721` NFT 接口的智能合约,支持铸造 NFT 并关联 IPFS 元数据链接.



#### 3.2.主要功能

##### 1.标准`ERC721`功能

- **`name()`** - 查询 NFT 集合名称
- **`symbol()`** - 查询 NFT 集合符号
- **`balanceOf(address owner)`** - 查询指定地址拥有的 NFT 数量
- **`ownerOf(uint256 tokenId)`** - 查询指定 token ID 的所有者
- **`tokenURI(uint256 tokenId)`** - 查询指定 token ID 的元数据 URI
- **`transferFrom(address from, address to, uint256 tokenId)`** - 转移 NFT
- **`approve(address to, uint256 tokenId)`** - 授权其他地址使用 NFT
- **`safeTransferFrom(...)`** - 安全转移 NFT

##### 2.NFT 铸造功能

- **`mintNFT(address to, string memory tokenURI)`** - 铸造单个 NFT
  - 允许任何人铸造 NFT
  - 要求：接收者地址不能为零地址, token URI 不能为空
  - 触发 `NFTMinted` 事件
  - 返回新铸造的 token ID

- **`batchMintNFT(address to, string[] memory tokenURIs)`** - 批量铸造 NFT(仅所有者)
  - 只有合约所有者可以调用
  - 批量铸造多个 NFT 到同一地址
  - 要求：接收者地址不能为零地址, token URIs 数组不能为空
  - 返回新铸造的 token ID 数组

##### 3.查询功能

- **`currentTokenId()`** - 查询下一个要使用的 token ID
- **`totalSupply()`** - 查询已铸造的 NFT 总数
- **`supportsInterface(bytes4 interfaceId)`** - 检查是否支持某个接口



#### 3.3.事件

- **`NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI)`**
  - 当铸造 NFT 时触发
  - `to`: 接收 NFT 的地址
  - `tokenId`: 新铸造的 token ID
  - `tokenURI`: NFT 元数据的 IPFS 链接

- **`Transfer(address indexed from, address indexed to, uint256 indexed tokenId)`**
  - 当转移 NFT 时触发(来自 ERC721 标准)

- **`Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)`**
  - 当授权 NFT 时触发(来自 ERC721 标准)



#### 3.4.构造函数参数

```solidity
constructor(
    string memory name,        // NFT 集合名称,如 "My NFT Collection"
    string memory symbol       // NFT 集合符号,如 "MNFT"
)
```



#### 3.5.使用示例

##### 部署合约

```javascript
const MyNFT = await ethers.getContractFactory("MyNFT");
const nft = await MyNFT.deploy(
  "My NFT Collection",    // 名称
  "MNFT"                  // 符号
);
```



##### 铸造`NFT`

```javascript
// 铸造单个 NFT
const tokenURI = "ipfs://QmYourHashHere";
const tx = await nft.mintNFT(recipientAddress, tokenURI);
const receipt = await tx.wait();
// 从事件中获取 token ID
const tokenId = receipt.logs[0].args.tokenId;
```



##### 批量铸造`NFT`(仅所有者)

```javascript
const tokenURIs = [
  "ipfs://QmHash1",
  "ipfs://QmHash2",
  "ipfs://QmHash3"
];
const tx = await nft.connect(owner).batchMintNFT(recipientAddress, tokenURIs);
```



##### 查询`NFT`信息

```javascript
// 查询 token URI
const uri = await nft.tokenURI(tokenId);

// 查询所有者
const owner = await nft.ownerOf(tokenId);

// 查询地址拥有的 NFT 数量
const balance = await nft.balanceOf(address);

// 查询总供应量
const total = await nft.totalSupply();
```



##### 转移`NFT`

```javascript
// 直接转移
await nft.transferFrom(fromAddress, toAddress, tokenId);

// 安全转移
await nft.safeTransferFrom(fromAddress, toAddress, tokenId);
```



#### 3.6.测试覆盖

测试文件 `test/MyNFT.js` 包含以下测试场景:

- **1.部署测试** - 验证合约初始化参数
- **2.mintNFT 功能测试** - 单个铸造、总供应量、token ID 递增、错误处理
- **3.batchMintNFT 功能测试** - 批量铸造、权限控制、错误处理
- **4.tokenURI 功能测试** - 查询元数据 URI、错误处理
- **5.ERC721 标准功能测试** - ownerOf、balanceOf、transferFrom、approve、safeTransferFrom
- **6.边界情况测试** - 大量铸造、不同 token URI 格式
- **7.综合场景测试** - 完整的 NFT 生命周期



#### 3.7.`IPFS`元数据准备

在铸造`NFT`之前,需要准备`IPFS`元数据:

1. **准备图片**: 将图片上传到`IPFS`(可以使用`Pinata`或其他工具)

2. **创建元数据`JSON`文件**:
```json
{
  "name": "My NFT #1",
  "description": "This is my first NFT",
  "image": "ipfs://QmYourImageHash",
  "attributes": [
    {
      "trait_type": "Color",
      "value": "Blue"
    },
    {
      "trait_type": "Rarity",
      "value": "Common"
    }
  ]
}
```

3. **上传元数据到`IPFS`**: 将`JSON`文件上传到`IPFS`,获取元数据链接

4. **使用元数据链接铸造`NFT`**: 使用获取的`IPFS`链接作为 `tokenURI` 参数

**参考文档**: https://docs.opensea.io/docs/metadata-standards



#### 3.8.安全特性

- 防止零地址铸造
- `token URI`验证
- 所有者权限控制(`batchMintNFT`功能)
- 标准`ERC721`接口实现
- 事件记录所有重要操作
- 安全转移功能(`safeTransferFrom`)



#### 3.9.查看 NFT

部署到`Sepolia`测试网络并铸造`NFT`后,可以在以下平台查看:

- **OpenSea 测试网**: https://testnets.opensea.io/
- **Etherscan 测试网**: https://sepolia.etherscan.io/
- **MetaMask**: 在钱包中查看`NFT`收藏



**注意事项:**

- 确保钱包已连接到`Sepolia`测试网络
- `NFT`需要一些时间才能在`OpenSea`上显示
- 确保`IPFS`元数据链接可访问



#### 3.10.`Gas`消耗估算

- 部署合约：~1,500,000 gas
- `mintNFT`：~100,000 gas
- `batchMintNFT`：~190,000 gas(每个 NFT)
- `transferFrom`：~50,000 gas
- `approve`：~49,000 gas
- `safeTransferFrom`：~41,000 gas
