const hre = require("hardhat");

/**
 * 验证单个合约的脚本
 */
async function main() {
  // 从命令行参数获取合约地址
  let address = null;
  
  // 方法1: 通过 --address 参数
  const addressIndex = process.argv.findIndex(arg => arg === "--address");
  if (addressIndex !== -1 && process.argv[addressIndex + 1]) {
    address = process.argv[addressIndex + 1];
  }
  
  // 方法2: 直接查找以 0x 开头的参数（排除 hardhat 相关参数）
  if (!address) {
    const hardhatArgs = ["hardhat", "run", "scripts/verify-contract.js", "--network"];
    address = process.argv.find(arg => 
      arg.startsWith("0x") && 
      arg.length === 42 && 
      !hardhatArgs.includes(arg)
    );
  }

  if (!address || !address.startsWith("0x")) {
    console.error("❌ 错误: 请提供有效的合约地址");
    console.log("\n📖 使用方法:");
    console.log("  方法1: npm run verify:contract -- --address <合约地址>");
    console.log("  方法2: npx hardhat run scripts/verify-contract.js --network sepolia --address <合约地址>");
    console.log("\n💡 示例:");
    console.log('  npm run verify:contract -- --address "0x1234567890123456789012345678901234567890"');
    console.log('  npx hardhat verify --network sepolia 0x1234567890123456789012345678901234567890');
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
