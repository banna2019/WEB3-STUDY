const hre = require("hardhat");

/**
 * 验证 BeggingContract 合约的脚本
 */
async function main() {
  // 从命令行参数获取合约地址
  let address = null;
  
  // 排除的硬编码参数（Hardhat 相关）
  const hardhatArgs = ["hardhat", "run", "scripts/verify-contract.js", "--network", "sepolia"];
  
  // 方法1: 通过 --address 或 -a 参数
  const addressIndex = process.argv.findIndex(arg => arg === "--address" || arg === "-a");
  if (addressIndex !== -1 && process.argv[addressIndex + 1]) {
    const potentialAddress = process.argv[addressIndex + 1];
    if (potentialAddress.startsWith("0x") && potentialAddress.length === 42) {
      address = potentialAddress;
    }
  }
  
  // 方法2: 直接查找以 0x 开头的参数（排除 hardhat 相关参数和已知参数）
  if (!address) {
    // 查找所有可能的地址参数
    for (let i = 0; i < process.argv.length; i++) {
      const arg = process.argv[i];
      // 检查是否是有效的以太坊地址格式
      if (arg && arg.startsWith("0x") && arg.length === 42) {
        // 排除已知的 hardhat 参数
        if (!hardhatArgs.includes(arg)) {
          // 检查前一个参数不是 --address（避免重复）
          const prevArg = i > 0 ? process.argv[i - 1] : "";
          if (prevArg !== "--address" && prevArg !== "-a") {
            address = arg;
            break;
          }
        }
      }
    }
  }

  // 如果还是没有找到地址，尝试从环境变量读取
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    // 尝试从环境变量读取
    if (process.env.CONTRACT_ADDRESS) {
      address = process.env.CONTRACT_ADDRESS;
    }
  }

  if (!address || !address.startsWith("0x") || address.length !== 42) {
    console.error("❌ 错误: 请提供有效的合约地址");
    console.log("\n📖 使用方法:");
    console.log("  方法1: 设置环境变量 CONTRACT_ADDRESS，然后运行 npm run verify:contract");
    console.log("  方法2: npm run verify:direct -- <合约地址> （推荐，最简单）");
    console.log("  方法3: npx hardhat verify --network sepolia <合约地址>");
    console.log("\n💡 示例:");
    console.log('  # 在 .env 文件中设置:');
    console.log('  CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890');
    console.log('  npm run verify:contract');
    console.log('');
    console.log('  # 或使用 verify:direct（推荐）:');
    console.log('  npm run verify:direct -- 0x1234567890123456789012345678901234567890');
    console.log('');
    console.log('  # 或直接使用 Hardhat:');
    console.log('  npx hardhat verify --network sepolia 0x1234567890123456789012345678901234567890');
    console.log('\n⚠️  重要提示:');
    console.log('  - hardhat run 命令不支持位置参数，必须使用环境变量或 verify:direct');
    console.log('  - BeggingContract 合约无构造函数参数');
    process.exit(1);
  }

  // 检查 API Key
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ 错误: 未设置 ETHERSCAN_API_KEY");
    console.log("💡 请在 .env 文件中设置 ETHERSCAN_API_KEY");
    process.exit(1);
  }

  console.log(`🔍 开始验证 BeggingContract 合约...`);
  console.log(`📍 合约地址: ${address}`);
  console.log(`🌐 网络: Sepolia`);
  console.log(`\n📊 构造函数参数: 无\n`);

  // BeggingContract 合约无构造函数参数
  const constructorArguments = [];

  // 重试机制
  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < maxRetries) {
    try {
      if (retryCount > 0) {
        console.log(`\n🔄 重试验证 (${retryCount}/${maxRetries - 1})...`);
        // 等待一段时间再重试（指数退避）
        const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      await hre.run("verify:verify", {
        address: address,
        constructorArguments: constructorArguments,
      });
      
      console.log(`\n✅ 合约验证成功!`);
      console.log(`🔗 查看合约: https://sepolia.etherscan.io/address/${address}`);
      return; // 成功，退出函数
      
    } catch (error) {
      lastError = error;
      
      // 如果已经验证过，直接成功
      if (error.message.includes("Already Verified") || 
          error.message.includes("already verified")) {
        console.log(`\n✅ 合约已验证过，无需重复验证`);
        console.log(`🔗 查看合约: https://sepolia.etherscan.io/address/${address}`);
        return; // 成功，退出函数
      }
      
      // 网络错误，尝试重试
      if (error.message.includes("network") || 
          error.message.includes("socket") ||
          error.message.includes("TLS") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("ETIMEDOUT") ||
          error.message.includes("timeout")) {
        retryCount++;
        if (retryCount < maxRetries) {
          continue; // 继续重试
        }
      } else {
        // 其他错误，不重试
        break;
      }
    }
  }

  // 所有重试都失败了
  console.error(`\n❌ 验证失败:`, lastError.message);
  console.log("\n💡 常见问题:");
  console.log("  1. 确保合约地址正确");
  console.log("  2. 确保合约已在 Sepolia 网络上部署");
  console.log("  3. 确保编译器版本和优化器设置与部署时一致");
  
  if (lastError.message.includes("network") || 
      lastError.message.includes("socket") ||
      lastError.message.includes("TLS")) {
    console.log("\n🌐 网络问题排查:");
    console.log("  1. 检查网络连接是否稳定");
    console.log("  2. 检查是否可以访问 Etherscan API");
    console.log("  3. 如果使用代理，请检查代理设置");
    console.log("  4. 稍后重试，可能是 Etherscan API 暂时不可用");
    console.log("\n💡 建议:");
    console.log("  - 等待几分钟后重试");
    console.log("  - 或使用 verify:direct 方法");
    console.log("  - 或手动在 Etherscan 上验证");
  }
  
  process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 验证过程出错:", error);
    process.exit(1);
  });
