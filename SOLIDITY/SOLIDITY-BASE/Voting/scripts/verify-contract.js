const hre = require("hardhat");

/**
 * 验证单个合约的脚本
 */
async function main() {
  // 从命令行参数获取合约地址
  let address = null;
  
  // 排除的硬编码参数（Hardhat 相关）
  const hardhatArgs = ["hardhat", "run", "scripts/verify-contract.js", "--network", "sepolia", "--address"];
  
  // 方法1: 通过 --address 参数
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
    console.log("\n📖 使用方法（必须使用 --address 参数）:");
    console.log("  方法1: npm run verify:contract -- --address <合约地址>");
    console.log("  方法2: npm run verify:direct -- <合约地址> （推荐，最简单）");
    console.log("  方法3: npx hardhat verify --network sepolia <合约地址>");
    console.log("  方法4: 设置环境变量 CONTRACT_ADDRESS，然后运行 npm run verify:contract");
    console.log("\n💡 示例:");
    console.log('  npm run verify:contract -- --address "0x59974d161a9099eBB1baC303762441df19851Bc2"');
    console.log('  npm run verify:direct -- 0x59974d161a9099eBB1baC303762441df19851Bc2');
    console.log('  npx hardhat verify --network sepolia 0x59974d161a9099eBB1baC303762441df19851Bc2');
    console.log('\n⚠️  重要提示:');
    console.log('  - hardhat run 命令不支持位置参数，必须使用 --address 参数');
    console.log('  - 或者使用 verify:direct 脚本（推荐）');
    process.exit(1);
  }

  // 检查 API Key
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ 错误: 未设置 ETHERSCAN_API_KEY");
    console.log("💡 请在 .env 文件中设置 ETHERSCAN_API_KEY");
    process.exit(1);
  }

  console.log(`🔍 开始验证合约...`);
  console.log(`📍 合约地址: ${address}`);
  console.log(`🌐 网络: Sepolia\n`);

  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log(`\n✅ 合约验证成功!`);
    console.log(`🔗 查看合约: https://sepolia.etherscan.io/address/${address}`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`\n✅ 合约已验证过，无需重复验证`);
      console.log(`🔗 查看合约: https://sepolia.etherscan.io/address/${address}`);
    } else {
      console.error(`\n❌ 验证失败:`, error.message);
      console.log("\n💡 常见问题:");
      console.log("  1. 确保合约地址正确");
      console.log("  2. 确保合约已在 Sepolia 网络上部署");
      console.log("  3. 确保编译器版本和优化器设置与部署时一致");
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 验证过程出错:", error);
    process.exit(1);
  });
