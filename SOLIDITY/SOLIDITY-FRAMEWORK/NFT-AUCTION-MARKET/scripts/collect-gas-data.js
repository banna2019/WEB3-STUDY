require("dotenv").config();
const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * 收集实际 Gas 数据的辅助脚本
 * 通过实际调用合约函数来收集 Gas 数据
 */

async function collectGasData() {
  console.log("📊 开始收集 Gas 数据...\n");

  const gasData = {};

  try {
    const [deployer, user1, user2] = await ethers.getSigners();

    // 1. AuctionNFT 合约
    console.log("📝 测试 AuctionNFT 合约...");
    const AuctionNFT = await ethers.getContractFactory("AuctionNFT");
    const deployTx = await AuctionNFT.deploy("Test NFT", "TNFT");
    const deployReceipt = await deployTx.waitForDeployment();
    const deploymentTx = await deployReceipt.deploymentTransaction();
    const deployGas = (await deploymentTx.wait()).gasUsed;

    const auctionNFT = await deployReceipt.getAddress();
    const nftContract = await ethers.getContractAt("AuctionNFT", auctionNFT);

    // 使用 deployer 账户铸造 NFT（因为只有 owner 可以 mint）
    const mintTx = await nftContract.mint(user1.address, "ipfs://test1");
    const mintReceipt = await mintTx.wait();
    const mintGas = mintReceipt.gasUsed;

    gasData.AuctionNFT = {
      deployment: deployGas.toString(),
      functions: {
        mint: mintGas.toString()
      }
    };
    console.log(`   ✅ 部署: ${deployGas.toString()}, Mint: ${mintGas.toString()}\n`);

    // 2. PriceOracle 合约
    console.log("📝 测试 PriceOracle 合约...");
    const MockAggregatorV3 = await ethers.getContractFactory("MockAggregatorV3");
    const mockFeed = await MockAggregatorV3.deploy(3000 * 10 ** 8, 8);
    await mockFeed.waitForDeployment();

    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    const oracleDeployTx = await PriceOracle.deploy(await mockFeed.getAddress());
    const oracleDeployReceipt = await oracleDeployTx.waitForDeployment();
    const oracleDeploymentTx = await oracleDeployReceipt.deploymentTransaction();
    const oracleDeployGas = (await oracleDeploymentTx.wait()).gasUsed;

    const priceOracle = await oracleDeployReceipt.getAddress();
    const oracleContract = await ethers.getContractAt("PriceOracle", priceOracle);

    // getETHPrice 是 view 函数，不需要 Gas，测试 setERC20PriceFeed
    // 使用一个有效的代币地址（可以使用零地址，但合约会验证）
    // 为了测试，我们使用一个随机地址
    const testTokenAddress = "0x1234567890123456789012345678901234567890";
    const setPriceFeedTx = await oracleContract.setERC20PriceFeed(testTokenAddress, await mockFeed.getAddress());
    const setPriceFeedReceipt = await setPriceFeedTx.wait();
    const setPriceFeedGas = setPriceFeedReceipt.gasUsed;

    gasData.PriceOracle = {
      deployment: oracleDeployGas.toString(),
      functions: {
        setERC20PriceFeed: setPriceFeedGas.toString()
      }
    };
    console.log(`   ✅ 部署: ${oracleDeployGas.toString()}, setERC20PriceFeed: ${setPriceFeedGas.toString()}\n`);

    // 3. Auction 合约
    console.log("📝 测试 Auction 合约...");
    const Auction = await ethers.getContractFactory("Auction");
    const auctionDeployTx = await Auction.deploy(
      priceOracle,
      ethers.parseUnits("250", 0), // 250 基点
      deployer.address
    );
    const auctionDeployReceipt = await auctionDeployTx.waitForDeployment();
    const auctionDeploymentTx = await auctionDeployReceipt.deploymentTransaction();
    const auctionDeployGas = (await auctionDeploymentTx.wait()).gasUsed;

    const auction = await auctionDeployReceipt.getAddress();
    const auctionContract = await ethers.getContractAt("Auction", auction);

    // 创建拍卖 - 需要先铸造 NFT 给 deployer，然后批准
    // 注意：mint 函数只能由 owner 调用，所以使用 deployer（owner）来 mint
    // mint 函数会返回新铸造的 tokenId，我们使用这个值
    const mintAuctionTx = await nftContract.mint(deployer.address, "ipfs://auction1");
    const mintAuctionReceipt = await mintAuctionTx.wait();
    
    // 从交易日志中获取 tokenId，或者从 totalSupply 计算
    // 更可靠的方法：从 mint 函数的返回值获取（需要调用静态方法）
    // 或者从事件中获取
    const mintEvent = mintAuctionReceipt.logs.find(
      log => {
        try {
          const parsed = nftContract.interface.parseLog(log);
          return parsed && parsed.name === "NFTMinted";
        } catch {
          return false;
        }
      }
    );
    
    let auctionTokenId;
    if (mintEvent) {
      const parsed = nftContract.interface.parseLog(mintEvent);
      auctionTokenId = parsed.args.tokenId;
    } else {
      // 如果无法从事件获取，使用 totalSupply
      const totalSupply = await nftContract.totalSupply();
      auctionTokenId = totalSupply; // totalSupply 就是最新的 tokenId
    }
    
    // 验证 NFT 所有权
    const ownerOfToken = await nftContract.ownerOf(auctionTokenId);
    if (ownerOfToken.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error(`NFT 所有权错误: 期望 ${deployer.address}, 实际 ${ownerOfToken}, tokenId: ${auctionTokenId}`);
    }
    
    // 使用 deployer 账户批准（因为 NFT 的所有者是 deployer）
    const approveTx = await nftContract.connect(deployer).approve(auction, auctionTokenId);
    await approveTx.wait();
    
    const createAuctionTx = await auctionContract.createAuction(
      auctionNFT,
      auctionTokenId,
      3600, // 1 小时
      ethers.parseEther("1.0"),
      ethers.ZeroAddress
    );
    const createAuctionReceipt = await createAuctionTx.wait();
    const createAuctionGas = createAuctionReceipt.gasUsed;

    gasData.Auction = {
      deployment: auctionDeployGas.toString(),
      functions: {
        createAuction: createAuctionGas.toString()
      }
    };
    console.log(`   ✅ 部署: ${auctionDeployGas.toString()}, createAuction: ${createAuctionGas.toString()}\n`);

    // 4. AuctionFactory 合约
    console.log("📝 测试 AuctionFactory 合约...");
    const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    const factoryDeployTx = await AuctionFactory.deploy();
    const factoryDeployReceipt = await factoryDeployTx.waitForDeployment();
    const factoryDeploymentTx = await factoryDeployReceipt.deploymentTransaction();
    const factoryDeployGas = (await factoryDeploymentTx.wait()).gasUsed;

    gasData.AuctionFactory = {
      deployment: factoryDeployGas.toString(),
      functions: {}
    };
    console.log(`   ✅ 部署: ${factoryDeployGas.toString()}\n`);

    return gasData;

  } catch (error) {
    console.error("❌ 收集 Gas 数据失败:", error.message);
    throw error;
  }
}

module.exports = { collectGasData };

