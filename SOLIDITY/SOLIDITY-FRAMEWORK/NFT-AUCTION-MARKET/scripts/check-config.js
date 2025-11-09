require("dotenv").config();

console.log("🔍 检查 Hardhat 配置...\n");

// 检查必要的环境变量
const requiredEnvVars = [
  "PRIVATE_KEY",
  "ETHERSCAN_API_KEY",
];

const optionalEnvVars = [
  "SEPOLIA_RPC_URL",
  "INFURA_PROJECT_ID",
  "CHAINLINK_ETH_USD_FEED",
  "FEE_RATE",
  "FEE_RECIPIENT",
  "NFT_NAME",
  "NFT_SYMBOL",
];

let hasErrors = false;

console.log("📋 必需的环境变量:");
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value && value !== "" && !value.includes("your_")) {
    console.log(`   ✅ ${varName}: 已设置`);
  } else {
    console.log(`   ❌ ${varName}: 未设置或无效`);
    hasErrors = true;
  }
});

console.log("\n📋 可选的环境变量:");
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value && value !== "" && !value.includes("your_")) {
    console.log(`   ✅ ${varName}: ${value}`);
  } else {
    console.log(`   ⚠️  ${varName}: 未设置 (将使用默认值)`);
  }
});

// 检查 RPC URL
console.log("\n🌐 网络配置:");
if (process.env.SEPOLIA_RPC_URL) {
  console.log(`   ✅ SEPOLIA_RPC_URL: ${process.env.SEPOLIA_RPC_URL}`);
} else if (process.env.INFURA_PROJECT_ID) {
  console.log(`   ✅ INFURA_PROJECT_ID: ${process.env.INFURA_PROJECT_ID}`);
  console.log(`   ℹ️  将使用: https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
} else {
  console.log(`   ⚠️  未设置 RPC URL，将使用公共 RPC: https://rpc.sepolia.org`);
}

if (hasErrors) {
  console.log("\n❌ 配置检查失败，请设置必需的环境变量");
  process.exit(1);
} else {
  console.log("\n✅ 配置检查通过!");
}

