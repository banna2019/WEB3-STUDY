require("dotenv").config();

console.log("🔍 检查 Hardhat 配置...\n");

// 检查 .env 文件是否存在
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env");

if (!fs.existsSync(envPath)) {
  console.log("❌ .env 文件不存在");
  console.log("💡 请先复制 .env.example 为 .env:");
  console.log("   cp .env.example .env\n");
  process.exit(1);
}

console.log("✅ .env 文件存在\n");

// 检查关键配置
const checks = [
  {
    name: "PRIVATE_KEY",
    value: process.env.PRIVATE_KEY,
    required: true,
    mask: true,
  },
  {
    name: "INFURA_PROJECT_ID",
    value: process.env.INFURA_PROJECT_ID,
    required: false,
    mask: false,
  },
  {
    name: "SEPOLIA_RPC_URL",
    value: process.env.SEPOLIA_RPC_URL,
    required: false,
    mask: true,
  },
  {
    name: "ETHERSCAN_API_KEY",
    value: process.env.ETHERSCAN_API_KEY,
    required: false,
    mask: true,
  },
];

console.log("📋 配置检查结果:\n");
let hasErrors = false;

checks.forEach((check) => {
  const isSet = check.value && check.value.trim() !== "" && check.value !== `your_${check.name.toLowerCase()}_here`;
  const status = isSet ? "✅" : check.required ? "❌" : "⚠️ ";
  
  let displayValue = check.value || "(未设置)";
  if (check.mask && displayValue !== "(未设置)") {
    displayValue = displayValue.substring(0, 10) + "***";
  }
  
  console.log(`${status} ${check.name}: ${displayValue}`);
  
  if (!isSet && check.required) {
    hasErrors = true;
  }
  
  // 特殊检查
  if (check.name === "INFURA_PROJECT_ID") {
    if (check.value === "your_infura_project_id_here") {
      console.log("   ⚠️  检测到占位符值，请替换为实际的 Project ID");
      hasErrors = true;
    } else if (check.value && (check.value.startsWith("http://") || check.value.startsWith("https://"))) {
      // 检测到完整 URL，尝试提取 Project ID
      const urlMatch = check.value.match(/infura\.io\/v3\/([^\/\s]+)/);
      if (urlMatch) {
        console.log(`   ℹ️  检测到完整 URL，已提取 Project ID: ${urlMatch[1].substring(0, 20)}...`);
      } else {
        console.log("   ⚠️  检测到 URL 格式但无法提取 Project ID");
      }
    } else if (check.value && check.value.includes("@") || check.value.includes("&")) {
      console.log("   ⚠️  Project ID 包含特殊字符，可能无效");
      console.log("   💡 建议: Project ID 应该只包含字母和数字");
    }
  }
});

console.log("\n");

// RPC URL 构建
let rpcUrl = "";
if (process.env.SEPOLIA_RPC_URL) {
  rpcUrl = process.env.SEPOLIA_RPC_URL;
  console.log("📡 将使用自定义 RPC URL");
} else if (process.env.INFURA_PROJECT_ID && 
           process.env.INFURA_PROJECT_ID.trim() !== "" && 
           process.env.INFURA_PROJECT_ID !== "your_infura_project_id_here") {
  rpcUrl = `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
  console.log("📡 将使用 Infura RPC");
} else {
  rpcUrl = "https://rpc.sepolia.org";
  console.log("📡 将使用公共 RPC (备用)");
}

console.log("🔗 RPC URL:", rpcUrl.replace(/(infura\.io\/v3\/)[a-zA-Z0-9]+/, "$1***"));

if (hasErrors) {
  console.log("\n❌ 配置检查失败，请修复上述问题后重试");
  console.log("\n💡 快速解决方案:");
  console.log("1. 确保 .env 文件存在: cp .env.example .env");
  console.log("2. 设置 PRIVATE_KEY: 你的钱包私钥（不含 0x 前缀）");
  console.log("3. 设置 INFURA_PROJECT_ID: 访问 https://app.infura.io/ 获取");
  console.log("   或设置 SEPOLIA_RPC_URL: 使用其他 RPC 端点");
  process.exit(1);
} else {
  console.log("\n✅ 配置检查通过，可以开始部署！");
  console.log("\n🚀 运行部署命令:");
  console.log("   npm run deploy:sepolia");
}
