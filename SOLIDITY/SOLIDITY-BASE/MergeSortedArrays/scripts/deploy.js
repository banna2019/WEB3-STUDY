const hre = require("hardhat");

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

  // 部署 MergeSortedArrays 合约
  console.log("📦 正在部署 MergeSortedArrays 合约...");
  const MergeSortedArrays = await hre.ethers.getContractFactory("MergeSortedArrays");
  const mergeSortedArrays = await MergeSortedArrays.deploy();
  await mergeSortedArrays.waitForDeployment();

  const mergeSortedArraysAddress = await mergeSortedArrays.getAddress();
  console.log("✅ MergeSortedArrays 部署成功!");
  console.log("📍 合约地址:", mergeSortedArraysAddress);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${mergeSortedArraysAddress}`);

  // 等待交易确认
  console.log("\n⏳ 等待交易确认...");
  await mergeSortedArrays.deploymentTransaction()?.wait(5);
  console.log("✅ 交易已确认!\n");

  // 可选：验证合约
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("🔍 开始验证合约...");
    try {
      await hre.run("verify:verify", {
        address: mergeSortedArraysAddress,
        constructorArguments: [],
      });
      console.log("✅ MergeSortedArrays 合约验证成功!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ MergeSortedArrays 合约已验证过");
      } else {
        console.log("⚠️  MergeSortedArrays 合约验证失败:", error.message);
      }
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
