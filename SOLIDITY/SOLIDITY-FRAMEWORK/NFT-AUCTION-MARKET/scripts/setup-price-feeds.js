require("dotenv").config();
const hre = require("hardhat");

/**
 * 设置 Chainlink 价格源的辅助脚本
 * 用于批量配置价格预言机合约的价格源
 */
async function main() {
  console.log("🔧 开始设置 Chainlink 价格源...\n");

  // 从环境变量读取价格预言机合约地址
  const priceOracleAddress = process.env.PRICE_ORACLE_ADDRESS;
  
  if (!priceOracleAddress || priceOracleAddress === "" || priceOracleAddress.includes("your_")) {
    console.error("❌ 错误: 请先部署 PriceOracle 合约并设置 PRICE_ORACLE_ADDRESS 环境变量");
    process.exit(1);
  }

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 操作账户:", deployer.address);
  console.log("📍 价格预言机地址:", priceOracleAddress);
  console.log("");

  // 检查合约是否存在
  console.log("🔍 检查 PriceOracle 合约是否存在...");
  try {
    const code = await hre.ethers.provider.getCode(priceOracleAddress);
    if (code === "0x" || code === "0x0") {
      console.error(`❌ 错误: 在当前网络(${hre.network.name})下,地址 ${priceOracleAddress} 处不存在合约`);
      console.error(`   请确保:`);
      console.error(`   1. 已在该网络部署 PriceOracle 合约`);
      console.error(`   2. PRICE_ORACLE_ADDRESS 环境变量中的地址正确`);
      console.error(`   3. 当前连接的网络正确`);
      process.exit(1);
    }
    console.log("✅ 合约存在,继续处理...\n");
  } catch (error) {
    console.error("❌ 检查合约时出错:", error.message);
    console.error(`   无法验证地址 ${priceOracleAddress} 处是否存在合约`);
    process.exit(1);
  }

  // 加载合约
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = PriceOracle.attach(priceOracleAddress);
  
  // 验证合约接口（尝试调用一个 view 函数）
  try {
    // 尝试调用 getETHPrice 函数来验证合约接口
    await priceOracle.getETHPrice();
    console.log("✅ 合约接口验证成功\n");
  } catch (error) {
    console.error("❌ 错误: 合约地址存在,但不是 PriceOracle 合约");
    console.error(`   地址 ${priceOracleAddress} 处的合约接口不匹配`);
    console.error(`   错误信息: ${error.message}`);
    console.error(`   请确保该地址是 PriceOracle 合约的地址`);
    process.exit(1);
  }

  // 价格源配置映射 (代币地址 => 价格源地址)
  // 注意：这里使用占位符地址，实际使用时需要替换为真实的代币地址和价格源地址
  const priceFeeds = {};

  // 从环境变量读取价格源配置
  const feedConfigs = [
    { token: "USDC_TOKEN", feed: "CHAINLINK_USDC_USD_FEED", name: "USDC/USD" },
    { token: "USDT_TOKEN", feed: "CHAINLINK_USDT_USD_FEED", name: "USDT/USD" },
    { token: "DAI_TOKEN", feed: "CHAINLINK_DAI_USD_FEED", name: "DAI/USD" },
    { token: "LINK_TOKEN", feed: "CHAINLINK_LINK_USD_FEED", name: "LINK/USD" },
    { token: "BTC_TOKEN", feed: "CHAINLINK_BTC_USD_FEED", name: "BTC/USD" },
    { token: "AAVE_TOKEN", feed: "CHAINLINK_AAVE_USD_FEED", name: "AAVE/USD" },
    { token: "UNI_TOKEN", feed: "CHAINLINK_UNI_USD_FEED", name: "UNI/USD" },
    { token: "CRV_TOKEN", feed: "CHAINLINK_CRV_USD_FEED", name: "CRV/USD" },
    { token: "MKR_TOKEN", feed: "CHAINLINK_MKR_USD_FEED", name: "MKR/USD" },
    { token: "FRAX_TOKEN", feed: "CHAINLINK_FRAX_USD_FEED", name: "FRAX/USD" },
  ];

  const validConfigs = [];

  console.log("📋 检查可用的价格源配置...\n");

  // 第一步：验证价格源是否可用
  for (const config of feedConfigs) {
    const tokenAddress = process.env[config.token];
    const feedAddress = process.env[config.feed];

    if (tokenAddress && feedAddress && 
        !tokenAddress.includes("your_") && 
        !feedAddress.includes("your_") &&
        hre.ethers.isAddress(tokenAddress) &&
        hre.ethers.isAddress(feedAddress)) {
      
      // 检查价格源是否已设置
      const hasFeed = await priceOracle.hasPriceFeed(tokenAddress);
      
      if (hasFeed) {
        console.log(`⏭️  跳过 ${config.name} (已设置)`);
        // 验证已设置的价格源是否可用
        try {
          const result = await priceOracle.getERC20Price(tokenAddress);
          // 处理返回值的类型（可能是数组或对象）
          let price, decimals;
          if (Array.isArray(result)) {
            price = result[0];
            decimals = result[1];
          } else {
            price = result.price;
            decimals = result.decimals;
          }
          
          // 确保类型正确
          const priceBigInt = typeof price === 'bigint' ? price : BigInt(price.toString());
          const decimalsNumber = typeof decimals === 'number' ? decimals : Number(decimals.toString());
          
          // 计算格式化价格
          const priceFormatted = (Number(priceBigInt) / (10 ** decimalsNumber)).toFixed(2);
          console.log(`   ✅ 价格源可用`);
          console.log(`   当前价格: $${priceFormatted}`);
          console.log(`   价格精度: ${decimalsNumber} 位小数`);
          console.log(`   原始价格: ${priceBigInt.toString()}\n`);
        } catch (error) {
          console.log(`   ⚠️  价格源已设置但不可用: ${error.message}`);
          console.log(`   💡 建议: 检查价格源地址是否正确或该价格源在测试网是否可用\n`);
        }
        continue;
      }

      // 验证价格源是否可用（在设置前）
      console.log(`🔍 验证 ${config.name} 价格源...`);
      try {
        // 使用 ABI 直接调用价格源合约
        const priceFeedABI = [
          "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
          "function decimals() external view returns (uint8)"
        ];
        
        const priceFeedContract = new hre.ethers.Contract(feedAddress, priceFeedABI, hre.ethers.provider);
        
        // 尝试获取价格数据
        const roundData = await priceFeedContract.latestRoundData();
        const price = roundData[1];
        const decimals = await priceFeedContract.decimals();
        
        // 确保类型正确
        const priceBigInt = typeof price === 'bigint' ? price : BigInt(price.toString());
        const decimalsNumber = typeof decimals === 'number' ? decimals : Number(decimals.toString());
        
        if (priceBigInt > 0n) {
          const priceFormatted = (Number(priceBigInt) / (10 ** decimalsNumber)).toFixed(2);
          validConfigs.push({
            name: config.name,
            token: tokenAddress,
            feed: feedAddress,
            price: priceFormatted,
            decimals: decimalsNumber
          });
          console.log(`   ✅ 价格源可用`);
          console.log(`   当前价格: $${priceFormatted}`);
          console.log(`   价格精度: ${decimalsNumber} 位小数`);
          console.log(`   代币地址: ${tokenAddress}`);
          console.log(`   价格源: ${feedAddress}\n`);
        } else {
          console.log(`   ⚠️  价格源返回无效价格, 跳过\n`);
        }
      } catch (error) {
        // 如果验证失败，仍然尝试设置（可能是网络问题）
        console.log(`   ⚠️  价格源验证失败: ${error.message}`);
        console.log(`   💡 仍将尝试设置，如果失败请检查地址是否正确\n`);
        validConfigs.push({
          name: config.name,
          token: tokenAddress,
          feed: feedAddress,
          price: "未知"
        });
      }
    }
  }

  if (validConfigs.length === 0) {
    console.log("ℹ️  没有可用的价格源需要设置");
    console.log("   提示:");
    console.log("   - 在 .env 文件中配置代币地址和价格源地址");
    console.log("   - 确保价格源地址在 Sepolia 测试网上可用");
    console.log("   - 参考 Chainlink 官方文档获取正确的价格源地址");
    return;
  }

  console.log(`\n📊 准备设置 ${validConfigs.length} 个价格源\n`);

  // 分别设置每个价格源，以便更好地处理错误
  const results = {
    success: [],
    failed: []
  };

  for (let i = 0; i < validConfigs.length; i++) {
    const config = validConfigs[i];
    console.log(`[${i + 1}/${validConfigs.length}] 设置 ${config.name}...`);
    
    try {
      const tx = await priceOracle.setERC20PriceFeed(config.token, config.feed);
      await tx.wait();
      
      // 验证设置
      const hasFeed = await priceOracle.hasPriceFeed(config.token);
      if (hasFeed) {
        try {
          const result = await priceOracle.getERC20Price(config.token);
          // 处理返回值的类型（可能是数组或对象）
          let price, decimals;
          if (Array.isArray(result)) {
            price = result[0];
            decimals = result[1];
          } else {
            price = result.price;
            decimals = result.decimals;
          }
          
          // 确保类型正确
          const priceBigInt = typeof price === 'bigint' ? price : BigInt(price.toString());
          const decimalsNumber = typeof decimals === 'number' ? decimals : Number(decimals.toString());
          
          // 计算格式化价格
          const priceFormatted = (Number(priceBigInt) / (10 ** decimalsNumber)).toFixed(2);
          
          results.success.push({
            name: config.name,
            price: priceFormatted,
            decimals: decimalsNumber
          });
          console.log(`   ✅ 设置成功`);
          console.log(`   当前价格: $${priceFormatted}`);
          console.log(`   价格精度: ${decimalsNumber} 位小数\n`);
        } catch (error) {
          results.failed.push({
            name: config.name,
            reason: `获取价格失败: ${error.message}`
          });
          console.log(`   ⚠️  设置成功但获取价格失败: ${error.message}\n`);
        }
      } else {
        results.failed.push({
          name: config.name,
          reason: "设置后验证失败"
        });
        console.log(`   ⚠️  设置失败\n`);
      }
    } catch (error) {
      results.failed.push({
        name: config.name,
        reason: error.message
      });
      console.log(`   ❌ 设置失败: ${error.message}\n`);
    }
  }

  // 显示摘要
  console.log("=".repeat(50));
  console.log("📊 设置摘要:");
  console.log(`   ✅ 成功: ${results.success.length}`);
  console.log(`   ❌ 失败: ${results.failed.length}`);
  console.log("=".repeat(50));

  if (results.success.length > 0) {
    console.log("\n✅ 成功设置的价格源:");
    results.success.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}: $${item.price} (精度: ${item.decimals} 位小数)`);
    });
  }

  if (results.failed.length > 0) {
    console.log("\n❌ 失败的价格源:");
    results.failed.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}: ${item.reason}`);
    });
    console.log("\n💡 提示:");
    console.log("   - 某些价格源在 Sepolia 测试网可能不可用");
    console.log("   - 请参考 Chainlink 官方文档确认价格源地址");
    console.log("   - 可以稍后手动设置可用的价格源");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 执行失败:", error);
    process.exit(1);
  });

