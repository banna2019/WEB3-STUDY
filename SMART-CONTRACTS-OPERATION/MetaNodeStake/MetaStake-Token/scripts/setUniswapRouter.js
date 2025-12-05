const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * 设置Uniswap Router脚本
 * 使用方法: npx hardhat run scripts/setUniswapRouter.js --network sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("操作账户:", deployer.address);
  console.log("网络:", network.name);

  // 优先使用环境变量中的地址，如果没有则从部署文件读取
  let metaStakeAddress = process.env.META_STAKE_ADDRESS;
  
  if (!metaStakeAddress) {
    // 尝试从部署文件读取
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
    
    if (fs.existsSync(deploymentFile)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
      if (deploymentInfo.contracts && deploymentInfo.contracts.metaStake) {
        metaStakeAddress = deploymentInfo.contracts.metaStake;
        console.log(`从部署文件读取MetaStake地址: ${metaStakeAddress}`);
      }
    }
  } else {
    console.log(`使用环境变量中的MetaStake地址: ${metaStakeAddress}`);
  }

  if (!metaStakeAddress) {
    console.error("错误: 请设置META_STAKE_ADDRESS环境变量或确保deployments目录中有部署文件");
    process.exit(1);
  }

  // 从环境变量读取Uniswap Router地址
  const uniswapRouterAddress = process.env.UNISWAP_ROUTER;
  
  if (!uniswapRouterAddress) {
    console.error("错误: 请设置UNISWAP_ROUTER环境变量");
    console.error("\n常用Uniswap Router地址:");
    console.error("  主网: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
    console.error("  Sepolia: 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008");
    process.exit(1);
  }

  const MetaStake = await ethers.getContractFactory("MetaStake");
  const metaStake = MetaStake.attach(metaStakeAddress);

  // 验证合约地址
  const code = await ethers.provider.getCode(metaStakeAddress);
  if (code === "0x") {
    console.error("错误: MetaStake合约地址无效");
    process.exit(1);
  }

  console.log("\n========== 设置Uniswap Router ==========");
  console.log("MetaStake合约地址:", metaStakeAddress);
  console.log("Uniswap Router地址:", uniswapRouterAddress);
  console.log("========================================\n");

  // 检查当前Router地址
  const currentRouter = await metaStake.uniswapRouter();
  if (currentRouter !== ethers.ZeroAddress) {
    console.log("当前Router地址:", currentRouter);
    console.log("将更新为:", uniswapRouterAddress);
  }

  // 设置Router
  console.log("发送交易...");
  const tx = await metaStake.setUniswapRouter(uniswapRouterAddress);
  console.log("交易哈希:", tx.hash);
  
  console.log("等待确认...");
  const receipt = await tx.wait();
  console.log("✓ 交易已确认，区块:", receipt.blockNumber);

  // 验证设置
  const newRouter = await metaStake.uniswapRouter();
  console.log("\n✓ Uniswap Router已设置:", newRouter);

  // 更新部署文件
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  
  if (fs.existsSync(deploymentFile)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    deploymentInfo.uniswapRouter = uniswapRouterAddress;
    deploymentInfo.uniswapRouterSetAt = new Date().toISOString();
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("✓ 部署文件已更新");
  }

  console.log("\n完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n操作失败:");
    console.error(error);
    process.exit(1);
  });

