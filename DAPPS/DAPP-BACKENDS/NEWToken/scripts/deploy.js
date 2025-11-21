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

  // 从环境变量获取部署参数（必须从 .env 文件读取）
  const tokenName = process.env.TOKEN_NAME;
  const tokenSymbol = process.env.TOKEN_SYMBOL;
  const tokenDecimals = process.env.TOKEN_DECIMALS;
  const initialSupplyStr = process.env.TOKEN_INITIAL_SUPPLY;

  // 检查必需的参数
  if (!tokenName || !tokenSymbol || !tokenDecimals || !initialSupplyStr) {
    console.error("❌ 错误: 缺少必需的部署参数");
    console.log("\n💡 请在 .env 文件中设置以下变量:");
    console.log("  TOKEN_NAME=NEW Token");
    console.log("  TOKEN_SYMBOL=NTK");
    console.log("  TOKEN_DECIMALS=18");
    console.log("  TOKEN_INITIAL_SUPPLY=100000000");
    process.exit(1);
  }
  
  // 计算初始供应量（带精度）
  // 将 tokenDecimals 转换为数字，parseUnits 需要数字类型
  const tokenDecimalsNum = parseInt(tokenDecimals, 10);
  const initialSupply = hre.ethers.parseUnits(initialSupplyStr, tokenDecimalsNum);

  console.log("📋 部署参数:");
  console.log("  代币名称:", tokenName);
  console.log("  代币符号:", tokenSymbol);
  console.log("  代币精度:", tokenDecimals);
  console.log("  初始供应量:", initialSupplyStr, tokenSymbol);
  console.log("  初始供应量（带精度）:", hre.ethers.formatUnits(initialSupply, tokenDecimalsNum), tokenSymbol);
  console.log("");

  // 部署 BlockInfoRecorderWithToken 合约
  console.log("📦 正在部署 BlockInfoRecorderWithToken 合约...");
  const Token = await hre.ethers.getContractFactory("BlockInfoRecorderWithToken");
  const token = await Token.deploy(tokenName, tokenSymbol, tokenDecimalsNum, initialSupply);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("✅ 合约部署成功!");
  console.log("📍 合约地址:", address);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${address}`);

  // 准备读取 .env 文件
  const envPath = path.join(__dirname, "..", ".env");
  
  if (!fs.existsSync(envPath)) {
    console.error("❌ 错误: .env 文件不存在");
    console.log("💡 请先创建 .env 文件: cp .env.example .env");
    process.exit(1);
  }

  let envContent = fs.readFileSync(envPath, "utf8");

  // 等待交易确认并获取部署区块号
  console.log("\n⏳ 等待交易确认...");
  const deployTx = token.deploymentTransaction();
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
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const owner = await token.owner();

  console.log("  代币名称:", name);
  console.log("  代币符号:", symbol);
  console.log("  代币精度:", decimals);
  console.log("  总供应量:", hre.ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("  合约所有者:", owner);
  console.log("");

  // 保存部署信息到 .env 文件

  // 更新或添加合约地址（自动替换）
  if (envContent.includes("CONTRACT_ADDRESS=")) {
    // 替换现有的 CONTRACT_ADDRESS 值
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${address}`
    );
  } else {
    // 如果不存在，添加到文件末尾
    envContent += `\n# 合约地址（自动更新）\nCONTRACT_ADDRESS=${address}\n`;
  }

  // 更新或添加部署区块号（自动替换）
  if (deploymentBlockNumber !== null) {
    if (envContent.includes("BLOCK_NUMBER=")) {
      // 替换现有的 BLOCK_NUMBER 值
      envContent = envContent.replace(
        /BLOCK_NUMBER=.*/,
        `BLOCK_NUMBER=${deploymentBlockNumber}`
      );
    } else {
      // 如果不存在，添加到文件末尾
      envContent += `\n# 合约部署区块号（自动更新）\nBLOCK_NUMBER=${deploymentBlockNumber}\n`;
    }
  }

  // 确保部署参数也在 .env 文件中（如果不存在则添加）
  const requiredParams = {
    TOKEN_NAME: tokenName,
    TOKEN_SYMBOL: tokenSymbol,
    TOKEN_DECIMALS: tokenDecimals,
    TOKEN_INITIAL_SUPPLY: initialSupplyStr,
  };

  Object.entries(requiredParams).forEach(([key, value]) => {
    if (!envContent.includes(`${key}=`)) {
      // 如果参数不存在，添加到文件末尾
      envContent += `${key}=${value}\n`;
    }
  });

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
        constructorArguments: [tokenName, tokenSymbol, initialSupply],
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
