const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

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

  // 部署 MyNFT 合约
  console.log("📦 正在部署 MyNFT 合约...");
  
  // NFT 合约参数（从环境变量读取，如果不存在则使用默认值）
  const nftName = process.env.NFT_NAME || "My NFT Collection";
  const nftSymbol = process.env.NFT_SYMBOL || "MNFT";
  
  console.log("📋 NFT 配置:");
  console.log("   - 名称:", nftName, process.env.NFT_NAME ? "(来自 .env)" : "(默认值)");
  console.log("   - 符号:", nftSymbol, process.env.NFT_SYMBOL ? "(来自 .env)" : "(默认值)");
  console.log("");
  
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy(nftName, nftSymbol);
  await myNFT.waitForDeployment();

  const address = await myNFT.getAddress();
  console.log("✅ MyNFT 部署成功!");
  console.log("📍 合约地址:", address);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${address}`);
  console.log("\n📊 NFT 信息:");
  console.log("   - 名称:", nftName);
  console.log("   - 符号:", nftSymbol);
  console.log("   - 总供应量:", await myNFT.totalSupply());

  // 等待交易确认
  console.log("\n⏳ 等待交易确认...");
  await myNFT.deploymentTransaction()?.wait(5);
  console.log("✅ 交易已确认!\n");

  // 自动将合约地址写入 .env 文件
  try {
    const envPath = path.join(__dirname, "..", ".env");
    let envContent = "";
    
    // 如果 .env 文件存在，读取内容
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
    
    // 更新或添加 CONTRACT_ADDRESS
    if (envContent.includes("CONTRACT_ADDRESS=")) {
      // 如果已存在，更新它
      envContent = envContent.replace(
        /CONTRACT_ADDRESS=.*/,
        `CONTRACT_ADDRESS=${address}`
      );
    } else {
      // 如果不存在，追加到文件末尾
      if (envContent && !envContent.endsWith("\n")) {
        envContent += "\n";
      }
      envContent += `\n# 合约地址(部署后自动生成)\nCONTRACT_ADDRESS=${address}\n`;
    }
    
    // 写入文件
    fs.writeFileSync(envPath, envContent, "utf8");
    console.log("💾 合约地址已自动保存到 .env 文件");
    console.log("   现在可以使用 npm run verify:contract 验证合约\n");
  } catch (error) {
    console.log("⚠️  无法自动保存合约地址到 .env 文件:", error.message);
    console.log("   请手动将以下内容添加到 .env 文件:");
    console.log(`   CONTRACT_ADDRESS=${address}\n`);
  }

  // 可选：验证合约
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("🔍 开始验证合约...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [nftName, nftSymbol],
      });
      console.log("✅ 合约验证成功!");
    } catch (error) {
      console.log("⚠️  合约验证失败:", error.message);
    }
  } else {
    console.log("ℹ️  跳过合约验证 (未设置 ETHERSCAN_API_KEY)");
  }

  console.log("\n✨ 部署完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
