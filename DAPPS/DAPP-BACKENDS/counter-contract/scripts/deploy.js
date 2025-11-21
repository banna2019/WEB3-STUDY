const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("🚀 开始部署合约到 Sepolia 测试网络...\n");

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

  // 部署 SimpleCounter 合约
  console.log("📦 正在部署 SimpleCounter 合约...");
  const Counter = await hre.ethers.getContractFactory("SimpleCounter");
  const counter = await Counter.deploy();
  await counter.waitForDeployment();

  const address = await counter.getAddress();
  console.log("✅ 合约部署成功!");
  console.log("📍 合约地址:", address);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${address}`);

  // 等待交易确认
  console.log("\n⏳ 等待交易确认...");
  const deployTx = counter.deploymentTransaction();
  let deploymentBlockNumber = null;

  if (deployTx) {
    const receipt = await deployTx.wait(5);
    console.log("✅ 交易已确认!");

    // 获取部署区块号
    deploymentBlockNumber = receipt.blockNumber;
    console.log("📍 部署区块号:", deploymentBlockNumber);
    console.log("");
  } else {
    console.log("✅ 交易已确认!\n");
  }

  // 验证合约信息
  console.log("🔍 验证合约信息...");
  const count = await counter.getCount();
  console.log("  当前计数器值:", count.toString());
  console.log("");

  // 保存部署信息到 .env 文件
  const envPath = path.join(__dirname, "..", ".env");

  if (!fs.existsSync(envPath)) {
    console.error("❌ 错误: .env 文件不存在");
    console.log("💡 请先创建 .env 文件: cp .env.example .env");
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, "utf8");

  // 更新或添加合约地址（自动替换）
  if (envContent.includes("CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${address}`
    );
  } else {
    envContent += `\n# 合约地址（自动更新）\nCONTRACT_ADDRESS=${address}\n`;
  }

  // 更新或添加部署区块号（自动替换）
  if (deploymentBlockNumber !== null) {
    if (envContent.includes("BLOCK_NUMBER=")) {
      envContent = envContent.replace(
        /BLOCK_NUMBER=.*/,
        `BLOCK_NUMBER=${deploymentBlockNumber}`
      );
    } else {
      envContent += `\n# 合约部署区块号（自动更新）\nBLOCK_NUMBER=${deploymentBlockNumber}\n`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log("💾 部署信息已自动更新到 .env 文件:");
  console.log("   - CONTRACT_ADDRESS:", address);
  if (deploymentBlockNumber !== null) {
    console.log("   - BLOCK_NUMBER:", deploymentBlockNumber);
  }

  // 可选：验证合约
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔍 开始验证合约...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("✅ 合约验证成功!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ 合约已验证过，无需重复验证");
      } else {
        console.log("⚠️  合约验证失败:", error.message);
        console.log("💡 可以稍后使用以下命令手动验证:");
        console.log(`   npm run verify:contract -- --address ${address}`);
      }
    }
  } else {
    console.log("\nℹ️  跳过合约验证 (未设置 ETHERSCAN_API_KEY)");
    console.log("💡 可以稍后使用以下命令验证:");
    console.log(`   npm run verify:contract -- --address ${address}`);
  }

  console.log("\n✨ 部署完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
