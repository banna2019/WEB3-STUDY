## 一、项目操作步骤

```bash
# 运行脚本创建项目
./init-solidity-project.sh [项目名称]

# 示例
./init-solidity-project.sh my-contract

# 进入项目并配置
cd my-contract
cp .env.example .env
# 编辑 .env 文件填写配置

# 检查配置
npm run check-config

# 编译和测试
npm run compile
npm test

# 部署
npm run deploy:sepolia
```



## 二、作业

### 2.1.`ERC20`代币

#### 代码内容

- 代码路径: `SOLIDITY/SOLIDITY-ADVENCED/ERC20/contracts/ERC20Token.sol`
- 说明文档: `SOLIDITY/SOLIDITY-ADVENCED/ERC20/README.md`



#### 任务 

- 参考: openzeppelin-contracts/contracts/token/ERC20/IERC20.sol;实现一个简单的`ERC20`代币合约.

#### 要求

- 1.合约包含标准`ERC20`功能,如`balanceOf`、`transfer`、`approve`和`transferFrom`.
- 2.使用`event`记录转账和授权操作
- 3.提供`mint`函数,允许合约所有者增发代币

#### 提示

- 使用`mapping`存储账户余额和授权信息
- 使用`event`定义`Transfer`和`Approval`事件
- 部署到`Sepolia`测试网,导入到自己的钱包





### 2.2.在测试网上发行一个图文并茂的`NFT`

#### 代码内容

- 代码路径: `SOLIDITY/SOLIDITY-ADVENCED/SPOLIA-NFT/contracts/MyNFT.sol`
- 说明文档: `SOLIDITY/SOLIDITY-ADVENCED/SPOLIA-NFT/README.md`



#### 任务目标

- 1.使用`Solidity`编写一个符合`ERC721`标准的`NFT`合约
- 2.将图文数据上传到`IPFS`,生成元数据链接
- 3.将合约部署到以太坊测试网(如`Goerli`或`Sepolia`)
- 4.铸造`NFT`并在测试网环境中查看

#### 任务步骤

##### 1.编写`NFT`合约

- 使用`OpenZeppelin`的`ERC721`库编写一个`NFT`合约
- 合约应包含以下功能:
  - 构造函数: 设置`NFT`的名称和符号
  - `mintNFT`函数: 允许用户铸造`NFT`,并关联元数据链接(`tokenURI`)
  - 在`Remix IDE`中编译合约



##### 2.准备图文数据

- 准备一张图片,并将其上传到`IPFS`(可以使用`Pinata`或其他工具)
- 创建一个`JSON`文件,描述`NFT`的属性(如名称、描述、图片链接等).
- 将`JSON`文件上传到`IPFS`,获取元数据链接
- `JSON`文件参考 https://docs.opensea.io/docs/metadata-standards



##### 3.部署合约到测试网

- 在`Remix IDE`中连接`MetaMask`,并确保`MetaMask`连接到`Goerli`或`Sepolia`测试网
- 部署`NFT`合约到测试网,并记录合约地址



##### 4.铸造`NFT`

- 使用`mintNFT`函数铸`NFT`
- 在`recipient`字段中输入你的钱包地址
- 在`tokenURI`字段中输入元数据的`IPFS`链接
- 在`MetaMask`中确认交易



##### 5.查看`NFT`

- 打开`OpenSea`测试网或`Etherscan`测试网
- 连接你的钱包,查看你铸造的`NFT`



### 2.3.编写一个讨饭合约

#### 代码内容

- 代码路径: `SOLIDITY/SOLIDITY-ADVENCED/BEG-CONSTRACT/contracts/BeggingContract.sol`
- 说明文档: `SOLIDITY/SOLIDITY-ADVENCED/BEG-CONSTRACT/README.md`



#### 任务目标

- 1.使用`Solidity`编写一个合约,允许用户向合约地址发送以太币.
- 2.记录每个捐赠者的地址和捐赠金额
- 3.允许合约所有者提取所有捐赠的资金



#### 任务步骤

##### 1.编写合约

  - 创建一个名为`BeggingContract`的合约
  - 合约应包含以下功能：
  - 一个`mapping`来记录每个捐赠者的捐赠金额
  - 一个`donate`函数,允许用户向合约发送以太币,并记录捐赠信息
  - 一个`withdraw`函数,允许合约所有者提取所有资金
  - 一个`getDonation`函数,允许查询某个地址的捐赠金额
  - 使用`payable`修饰符和 `ddress.transfer`实现支付和提款



##### 2.部署合约

  - 在`Remix IDE`中编译合约
  - 部署合约到`Goerli`或`Sepolia`测试网



##### 3.测试合约

  - 使用`MetaMask`向合约发送以太币,测试`donate`功能
  - 调用`withdraw`函数,测试合约所有者是否可以提取资金
  - 调用`getDonation`函数,查询某个地址的捐赠金额





#### 任务要求

##### 1.合约代码

  - 使用`mapping`记录捐赠者的地址和金额
  - 使用`payable`修饰符实现`donate`和`withdraw`函数
  - 使用`onlyOwner`修饰符限制`withdraw`函数只能由合约所有者调用



##### 2.测试网部署：

  - 合约必须部署到`Goerli`或`Sepolia`测试网



##### 3.功能测试：

  - 确保`donate`、`withdraw`和`getDonation`函数正常工作



#### 提交内容

- 1.合约代码：提交`Solidity`合约文件(如`BeggingContract.sol`)
- 2.合约地址：提交部署到测试网的合约地址
- 3.测试截图：提交在`Remix`或`Etherscan`上测试合约的截图



#### 额外挑战(可选)

- 1.捐赠事件：添加`Donation`事件,记录每次捐赠的地址和金额
- 2.捐赠排行榜：实现一个功能,显示捐赠金额最多的前 3 个地址
- 3.时间限制：添加一个时间限制,只有在特定时间段内才能捐赠



