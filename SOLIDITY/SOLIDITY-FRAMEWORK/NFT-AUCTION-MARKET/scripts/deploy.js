const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 开始部署 NFT 拍卖市场合约到 Sepolia 测试网络...\n");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 部署账户地址:", deployer.address);

  // 获取账户余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", hre.ethers.formatEther(balance), "ETH\n");

  // 检查余额是否足够支付 gas 费用
  if (balance === 0n) {
    throw new Error("❌ 账户余额不足，请先获取 Sepolia ETH");
  }

  // 从环境变量获取配置
  const chainlinkEthUsdFeed = process.env.CHAINLINK_ETH_USD_FEED || "0x694AA1769357215DE4FAC081bf1f309aDC325306"; // Sepolia 默认地址
  const feeRate = process.env.FEE_RATE || "250"; // 2.5% (250 基点)
  
  // 验证并设置手续费接收地址
  let feeRecipient = process.env.FEE_RECIPIENT;
  // 如果是占位符、空值或无效地址，使用部署者地址
  if (!feeRecipient || 
      feeRecipient === "" || 
      feeRecipient.includes("your_") || 
      feeRecipient.includes("address_here") ||
      !ethers.isAddress(feeRecipient)) {
    feeRecipient = deployer.address;
    console.log("⚠️  FEE_RECIPIENT 未设置或无效，使用部署者地址:", feeRecipient);
  }

  console.log("📋 部署配置:");
  console.log("   - Chainlink ETH/USD Feed:", chainlinkEthUsdFeed);
  console.log("   - 手续费率:", feeRate, "基点 (", (Number(feeRate) / 100).toFixed(2), "%)");
  console.log("   - 手续费接收地址:", feeRecipient);
  console.log("");

  const deployedAddresses = {};

  try {
    // 1. 部署 NFT 合约
    console.log("📦 正在部署 AuctionNFT 合约...");
    const AuctionNFT = await hre.ethers.getContractFactory("AuctionNFT");
    const nftName = process.env.NFT_NAME || "Auction NFT Collection";
    const nftSymbol = process.env.NFT_SYMBOL || "ANFT";
    const auctionNFT = await AuctionNFT.deploy(nftName, nftSymbol);
    await auctionNFT.waitForDeployment();
    const nftAddress = await auctionNFT.getAddress();
    deployedAddresses.NFT_CONTRACT_ADDRESS = nftAddress;
    console.log("✅ AuctionNFT 部署成功!");
    console.log("📍 合约地址:", nftAddress);
    console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${nftAddress}\n`);

    // 2. 部署价格预言机合约
    console.log("📦 正在部署 PriceOracle 合约...");
    const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
    const priceOracle = await PriceOracle.deploy(chainlinkEthUsdFeed);
    await priceOracle.waitForDeployment();
    const oracleAddress = await priceOracle.getAddress();
    deployedAddresses.PRICE_ORACLE_ADDRESS = oracleAddress;
    console.log("✅ PriceOracle 部署成功!");
    console.log("📍 合约地址:", oracleAddress);
    console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${oracleAddress}\n`);

    // 3. 部署普通拍卖合约（可选，用于对比）
    console.log("📦 正在部署 Auction 合约（普通版本）...");
    const Auction = await hre.ethers.getContractFactory("Auction");
    const auction = await Auction.deploy(oracleAddress, feeRate, feeRecipient);
    await auction.waitForDeployment();
    const auctionAddress = await auction.getAddress();
    deployedAddresses.AUCTION_CONTRACT_ADDRESS = auctionAddress;
    console.log("✅ Auction 部署成功!");
    console.log("📍 合约地址:", auctionAddress);
    console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${auctionAddress}\n`);

    // 4. 部署可升级拍卖合约（UUPS 代理模式）
    console.log("📦 正在部署 AuctionUpgradeable 合约（UUPS 代理模式）...");
    const AuctionUpgradeable = await hre.ethers.getContractFactory("AuctionUpgradeable");
    const auctionUpgradeable = await hre.upgrades.deployProxy(
      AuctionUpgradeable,
      [oracleAddress, feeRate, feeRecipient],
      { initializer: "initialize", kind: "uups" }
    );
    await auctionUpgradeable.waitForDeployment();
    const auctionUpgradeableAddress = await auctionUpgradeable.getAddress();
    const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(auctionUpgradeableAddress);
    deployedAddresses.AUCTION_UPGRADEABLE_ADDRESS = auctionUpgradeableAddress;
    deployedAddresses.AUCTION_IMPLEMENTATION_ADDRESS = implementationAddress;
    console.log("✅ AuctionUpgradeable 部署成功!");
    console.log("📍 代理合约地址:", auctionUpgradeableAddress);
    console.log("📍 实现合约地址:", implementationAddress);
    console.log("🔗 Etherscan (代理):", `https://sepolia.etherscan.io/address/${auctionUpgradeableAddress}`);
    console.log("🔗 Etherscan (实现):", `https://sepolia.etherscan.io/address/${implementationAddress}\n`);

    // 5. 部署工厂合约
    console.log("📦 正在部署 AuctionFactory 合约...");
    const AuctionFactory = await hre.ethers.getContractFactory("AuctionFactory");
    const auctionFactory = await AuctionFactory.deploy();
    await auctionFactory.waitForDeployment();
    const factoryAddress = await auctionFactory.getAddress();
    deployedAddresses.AUCTION_FACTORY_ADDRESS = factoryAddress;
    console.log("✅ AuctionFactory 部署成功!");
    console.log("📍 合约地址:", factoryAddress);
    console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${factoryAddress}\n`);

    // 等待交易确认
    console.log("⏳ 等待交易确认...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("✅ 交易已确认!\n");

    // 自动将合约地址和验证参数写入 .env 文件
    try {
      const envPath = path.join(__dirname, "..", ".env");
      let envContent = "";
      
      // 如果 .env 文件存在，读取内容
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, "utf8");
      }
      
      // 更新或添加合约地址
      for (const [key, value] of Object.entries(deployedAddresses)) {
        if (envContent.includes(`${key}=`)) {
          // 如果已存在，更新它
          envContent = envContent.replace(
            new RegExp(`${key}=.*`),
            `${key}=${value}`
          );
        } else {
          // 如果不存在，追加到文件末尾
          if (envContent && !envContent.endsWith("\n")) {
            envContent += "\n";
          }
          envContent += `${key}=${value}\n`;
        }
      }
      
      // 保存验证参数
      const verifyParams = {
        NFT_VERIFY_NAME: nftName,
        NFT_VERIFY_SYMBOL: nftSymbol,
        PRICE_ORACLE_VERIFY_FEED: chainlinkEthUsdFeed,
        AUCTION_VERIFY_ORACLE: oracleAddress,
        AUCTION_VERIFY_FEE_RATE: feeRate,
        AUCTION_VERIFY_FEE_RECIPIENT: feeRecipient,
        AUCTION_UPGRADEABLE_VERIFY_ORACLE: oracleAddress,
        AUCTION_UPGRADEABLE_VERIFY_FEE_RATE: feeRate,
        AUCTION_UPGRADEABLE_VERIFY_FEE_RECIPIENT: feeRecipient,
      };
      
      // 更新或添加验证参数
      for (const [key, value] of Object.entries(verifyParams)) {
        if (envContent.includes(`${key}=`)) {
          // 如果已存在，更新它
          envContent = envContent.replace(
            new RegExp(`${key}=.*`),
            `${key}=${value}`
          );
        } else {
          // 如果不存在，追加到文件末尾
          if (envContent && !envContent.endsWith("\n")) {
            envContent += "\n";
          }
          envContent += `${key}=${value}\n`;
        }
      }
      
      // 写入文件
      fs.writeFileSync(envPath, envContent, "utf8");
      console.log("💾 合约地址和验证参数已自动保存到 .env 文件");
      console.log("   现在可以使用 npm run verify:all 验证所有合约\n");
    } catch (error) {
      console.log("⚠️  无法自动保存合约地址到 .env 文件:", error.message);
      console.log("   请手动将以下内容添加到 .env 文件:\n");
      for (const [key, value] of Object.entries(deployedAddresses)) {
        console.log(`   ${key}=${value}`);
      }
      console.log("");
    }

    // 可选：验证合约
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("🔍 开始验证合约...");
      
      // 验证 NFT 合约
      try {
        await hre.run("verify:verify", {
          address: nftAddress,
          constructorArguments: [nftName, nftSymbol],
        });
        console.log("✅ AuctionNFT 验证成功!");
      } catch (error) {
        console.log("⚠️  AuctionNFT 验证失败:", error.message);
      }

      // 验证价格预言机合约
      try {
        await hre.run("verify:verify", {
          address: oracleAddress,
          constructorArguments: [chainlinkEthUsdFeed],
        });
        console.log("✅ PriceOracle 验证成功!");
      } catch (error) {
        console.log("⚠️  PriceOracle 验证失败:", error.message);
      }

      // 验证普通拍卖合约
      try {
        await hre.run("verify:verify", {
          address: auctionAddress,
          constructorArguments: [oracleAddress, feeRate, feeRecipient],
        });
        console.log("✅ Auction 验证成功!");
      } catch (error) {
        console.log("⚠️  Auction 验证失败:", error.message);
      }

      // 验证可升级拍卖合约（实现合约）
      try {
        await hre.run("verify:verify", {
          address: implementationAddress,
          constructorArguments: [],
        });
        console.log("✅ AuctionUpgradeable (实现) 验证成功!");
      } catch (error) {
        console.log("⚠️  AuctionUpgradeable (实现) 验证失败:", error.message);
      }

      // 验证工厂合约
      try {
        await hre.run("verify:verify", {
          address: factoryAddress,
          constructorArguments: [],
        });
        console.log("✅ AuctionFactory 验证成功!");
      } catch (error) {
        console.log("⚠️  AuctionFactory 验证失败:", error.message);
      }
    } else {
      console.log("ℹ️  跳过合约验证 (未设置 ETHERSCAN_API_KEY)");
    }

    console.log("\n✨ 部署完成!");
    console.log("\n📊 部署摘要:");
    console.log("   - NFT 合约:", nftAddress);
    console.log("   - 价格预言机:", oracleAddress);
    console.log("   - 普通拍卖合约:", auctionAddress);
    console.log("   - 可升级拍卖合约 (代理):", auctionUpgradeableAddress);
    console.log("   - 可升级拍卖合约 (实现):", implementationAddress);
    console.log("   - 工厂合约:", factoryAddress);

  } catch (error) {
    console.error("❌ 部署失败:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });

