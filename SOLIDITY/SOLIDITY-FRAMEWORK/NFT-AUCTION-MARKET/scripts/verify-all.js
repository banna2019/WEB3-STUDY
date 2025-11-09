require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * 更新 .env 文件中的环境变量
 */
function updateEnvFile(key, value) {
  const envPath = path.join(__dirname, "..", ".env");
  
  if (!fs.existsSync(envPath)) {
    console.log(`⚠️  .env 文件不存在，跳过更新 ${key}`);
    return;
  }
  
  let envContent = fs.readFileSync(envPath, "utf8");
  
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
  
  fs.writeFileSync(envPath, envContent, "utf8");
}

/**
 * 验证合约
 */
async function verifyContract(name, address, constructorArgs = []) {
  if (!address || address === "" || address === "your_contract_address_here") {
    console.log(`⏭️  跳过 ${name}（地址未设置）`);
    return { success: false, skipped: true };
  }

  console.log(`\n🔍 验证 ${name}...`);
  console.log(`   地址: ${address}`);
  if (constructorArgs.length > 0) {
    console.log(`   构造函数参数: ${constructorArgs.join(", ")}`);
  }

  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ ${name} 验证成功!`);
    return { success: true, skipped: false };
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`✅ ${name} 已经验证过了!`);
      return { success: true, skipped: false };
    } else {
      console.log(`❌ ${name} 验证失败: ${error.message}`);
      return { success: false, skipped: false, error: error.message };
    }
  }
}

async function main() {
  console.log("🔍 开始验证所有合约...\n");

  // 检查 Etherscan API Key
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ 错误: 未设置 ETHERSCAN_API_KEY");
    console.log("请在 .env 文件中设置 ETHERSCAN_API_KEY");
    process.exit(1);
  }

  // 从环境变量读取合约地址
  const nftAddress = process.env.NFT_CONTRACT_ADDRESS;
  const oracleAddress = process.env.PRICE_ORACLE_ADDRESS;
  const auctionAddress = process.env.AUCTION_CONTRACT_ADDRESS;
  const auctionUpgradeableAddress = process.env.AUCTION_UPGRADEABLE_ADDRESS;
  const auctionImplementationAddress = process.env.AUCTION_IMPLEMENTATION_ADDRESS;
  const factoryAddress = process.env.AUCTION_FACTORY_ADDRESS;

  // 从环境变量读取验证参数，如果不存在则使用默认值或从其他配置获取
  const nftName = process.env.NFT_VERIFY_NAME || process.env.NFT_NAME || "Auction NFT Collection";
  const nftSymbol = process.env.NFT_VERIFY_SYMBOL || process.env.NFT_SYMBOL || "ANFT";
  const oracleFeed = process.env.PRICE_ORACLE_VERIFY_FEED || process.env.CHAINLINK_ETH_USD_FEED || "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  const auctionVerifyOracle = process.env.AUCTION_VERIFY_ORACLE || oracleAddress; // 使用价格预言机地址
  const auctionFeeRate = process.env.AUCTION_VERIFY_FEE_RATE || process.env.FEE_RATE || "250";
  const auctionFeeRecipient = process.env.AUCTION_VERIFY_FEE_RECIPIENT || process.env.FEE_RECIPIENT;
  const upgradeableVerifyOracle = process.env.AUCTION_UPGRADEABLE_VERIFY_ORACLE || oracleAddress; // 使用价格预言机地址
  const upgradeableFeeRate = process.env.AUCTION_UPGRADEABLE_VERIFY_FEE_RATE || process.env.FEE_RATE || "250";
  const upgradeableFeeRecipient = process.env.AUCTION_UPGRADEABLE_VERIFY_FEE_RECIPIENT || process.env.FEE_RECIPIENT;

  // 自动更新验证参数到 .env 文件（如果缺失且已有合约地址）
  if (oracleAddress && !process.env.AUCTION_VERIFY_ORACLE) {
    updateEnvFile("AUCTION_VERIFY_ORACLE", oracleAddress);
  }
  if (oracleAddress && !process.env.AUCTION_UPGRADEABLE_VERIFY_ORACLE) {
    updateEnvFile("AUCTION_UPGRADEABLE_VERIFY_ORACLE", oracleAddress);
  }
  if (!process.env.NFT_VERIFY_NAME) updateEnvFile("NFT_VERIFY_NAME", nftName);
  if (!process.env.NFT_VERIFY_SYMBOL) updateEnvFile("NFT_VERIFY_SYMBOL", nftSymbol);
  if (!process.env.PRICE_ORACLE_VERIFY_FEED) updateEnvFile("PRICE_ORACLE_VERIFY_FEED", oracleFeed);
  if (!process.env.AUCTION_VERIFY_FEE_RATE) updateEnvFile("AUCTION_VERIFY_FEE_RATE", auctionFeeRate);
  if (!process.env.AUCTION_UPGRADEABLE_VERIFY_FEE_RATE) updateEnvFile("AUCTION_UPGRADEABLE_VERIFY_FEE_RATE", upgradeableFeeRate);
  if (auctionFeeRecipient && !process.env.AUCTION_VERIFY_FEE_RECIPIENT) {
    updateEnvFile("AUCTION_VERIFY_FEE_RECIPIENT", auctionFeeRecipient);
  }
  if (upgradeableFeeRecipient && !process.env.AUCTION_UPGRADEABLE_VERIFY_FEE_RECIPIENT) {
    updateEnvFile("AUCTION_UPGRADEABLE_VERIFY_FEE_RECIPIENT", upgradeableFeeRecipient);
  }

  const results = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
  };

  // 1. 验证 NFT 合约
  if (nftAddress) {
    results.total++;
    const result = await verifyContract("AuctionNFT", nftAddress, [nftName, nftSymbol]);
    if (result.success) results.success++;
    else if (result.skipped) results.skipped++;
    else results.failed++;
  } else {
    results.skipped++;
  }

  // 2. 验证价格预言机合约
  if (oracleAddress) {
    results.total++;
    const result = await verifyContract("PriceOracle", oracleAddress, [oracleFeed]);
    if (result.success) results.success++;
    else if (result.skipped) results.skipped++;
    else results.failed++;
  } else {
    results.skipped++;
  }

  // 3. 验证普通拍卖合约
  if (auctionAddress && auctionVerifyOracle && auctionFeeRecipient) {
    results.total++;
    const result = await verifyContract("Auction", auctionAddress, [
      auctionVerifyOracle,
      auctionFeeRate,
      auctionFeeRecipient,
    ]);
    if (result.success) results.success++;
    else if (result.skipped) results.skipped++;
    else results.failed++;
  } else {
    if (auctionAddress) {
      console.log("\n⚠️  跳过 Auction 合约验证（缺少验证参数）");
      console.log("   需要: AUCTION_VERIFY_ORACLE, AUCTION_VERIFY_FEE_RECIPIENT");
      console.log(`   当前: AUCTION_VERIFY_ORACLE=${auctionVerifyOracle}, AUCTION_VERIFY_FEE_RECIPIENT=${auctionFeeRecipient}`);
    }
    results.skipped++;
  }

  // 4. 验证可升级拍卖合约（实现合约）
  // 注意：实现合约没有构造函数参数
  if (auctionImplementationAddress) {
    results.total++;
    const result = await verifyContract("AuctionUpgradeable (实现)", auctionImplementationAddress, []);
    if (result.success) results.success++;
    else if (result.skipped) results.skipped++;
    else results.failed++;
  } else {
    results.skipped++;
  }

  // 5. 验证工厂合约
  if (factoryAddress) {
    results.total++;
    const result = await verifyContract("AuctionFactory", factoryAddress, []);
    if (result.success) results.success++;
    else if (result.skipped) results.skipped++;
    else results.failed++;
  } else {
    results.skipped++;
  }

  // 打印验证摘要
  console.log("\n" + "=".repeat(50));
  console.log("📊 验证摘要:");
  console.log(`   总计: ${results.total}`);
  console.log(`   ✅ 成功: ${results.success}`);
  console.log(`   ❌ 失败: ${results.failed}`);
  console.log(`   ⏭️  跳过: ${results.skipped}`);
  console.log("=".repeat(50));

  // 如果有失败的验证，退出码为 1
  if (results.failed > 0) {
    console.log("\n⚠️  部分合约验证失败，请检查错误信息");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 验证过程出错:", error);
    process.exit(1);
  });

