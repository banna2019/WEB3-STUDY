const hre = require("hardhat");
require("dotenv").config();

/**
 * 验证单个合约的脚本
 * 合约地址从 .env 文件中的 CONTRACT_ADDRESS 变量获取
 */
async function main() {
  // 优先从环境变量获取合约地址
  let address = process.env.CONTRACT_ADDRESS;

  // 如果环境变量中没有，检查是否有命令行参数（向后兼容）
  if (!address) {
    const addressIndex = process.argv.findIndex(arg => arg === "--address");
    if (addressIndex !== -1 && process.argv[addressIndex + 1]) {
      address = process.argv[addressIndex + 1];
    }
  }

  // 验证地址格式
  if (!address || !address.startsWith("0x") || address.length !== 42) {
    console.error("❌ 错误: 未找到有效的合约地址");
    console.log("\n💡 解决方法:");
    console.log("  1. 在 .env 文件中设置 CONTRACT_ADDRESS 变量");
    console.log("  2. 或者运行部署脚本，它会自动更新 CONTRACT_ADDRESS");
    console.log("\n📖 使用示例:");
    console.log("  在 .env 文件中添加:");
    console.log("  CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890");
    console.log("\n  然后运行:");
    console.log("  npm run verify:contract");
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
