require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("🔍 开始验证合约...\n");

  // 从环境变量或命令行参数读取合约地址
  // 支持多个合约地址环境变量
  const contractAddress = 
    process.argv[2] || // 命令行参数优先
    process.env.NFT_CONTRACT_ADDRESS ||
    process.env.PRICE_ORACLE_ADDRESS ||
    process.env.AUCTION_CONTRACT_ADDRESS ||
    process.env.AUCTION_UPGRADEABLE_ADDRESS ||
    process.env.AUCTION_IMPLEMENTATION_ADDRESS ||
    process.env.AUCTION_FACTORY_ADDRESS ||
    process.env.CONTRACT_ADDRESS; // 兼容旧的环境变量名

  if (!contractAddress || contractAddress === "" || contractAddress.includes("your_")) {
    console.error("❌ 错误: 请提供合约地址");
    console.log("\n使用方法:");
    console.log("  方式 1: 使用命令行参数（推荐）");
    console.log("    npm run verify:contract -- <合约地址> <构造函数参数...>");
    console.log("    例如: npm run verify:contract -- 0x1234... \"Auction NFT\" ANFT");
    console.log("\n  方式 2: 设置环境变量");
    console.log("    可用的环境变量名:");
    console.log("    - NFT_CONTRACT_ADDRESS");
    console.log("    - PRICE_ORACLE_ADDRESS");
    console.log("    - AUCTION_CONTRACT_ADDRESS");
    console.log("    - AUCTION_UPGRADEABLE_ADDRESS");
    console.log("    - AUCTION_IMPLEMENTATION_ADDRESS");
    console.log("    - AUCTION_FACTORY_ADDRESS");
    console.log("\n  方式 3: 验证所有合约（推荐）");
    console.log("    npm run verify:all");
    process.exit(1);
  }

  // 从环境变量读取构造函数参数（如果有）
  const constructorArgs = process.argv.slice(3);

  console.log("📋 验证信息:");
  console.log("   - 合约地址:", contractAddress);
  if (constructorArgs.length > 0) {
    console.log("   - 构造函数参数:", constructorArgs.join(", "));
  }
  console.log("");

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs.length > 0 ? constructorArgs : [],
    });
    console.log("\n✅ 合约验证成功!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ 合约已经验证过了!");
    } else {
      console.error("\n❌ 验证失败:", error.message);
      console.log("\n💡 提示:");
      console.log("   - 确保合约已经部署到网络");
      console.log("   - 检查构造函数参数是否正确");
      console.log("   - 如果使用代理合约，请验证实现合约地址");
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 验证失败:", error);
    process.exit(1);
  });

