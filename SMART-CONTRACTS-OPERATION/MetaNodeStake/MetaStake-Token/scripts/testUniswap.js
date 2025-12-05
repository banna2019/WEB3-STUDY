const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * 测试Uniswap集成脚本
 * 使用方法: npx hardhat run scripts/testUniswap.js --network sepolia
 * 
 * 此脚本用于测试Uniswap集成功能，包括：
 * 1. 检查Uniswap Router是否已配置
 * 2. 测试预估交换输出功能
 * 3. 显示交换路径信息
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("测试账户:", deployer.address);
  console.log("网络:", network.name);

  // 从部署文件读取合约地址
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("错误: 未找到部署文件:", deploymentFile);
    console.error("请先运行部署脚本");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  // 优先使用环境变量中的地址，如果没有则从部署文件读取
  const metaStakeAddress = process.env.META_STAKE_ADDRESS || deploymentInfo.contracts.metaStake;
  const metaNodeTokenAddress = process.env.META_NODE_TOKEN_ADDRESS || deploymentInfo.contracts.metaNodeToken;

  const MetaStake = await ethers.getContractFactory("MetaStake");
  const metaStake = MetaStake.attach(metaStakeAddress);

  const MetaNodeToken = await ethers.getContractFactory("MetaNodeToken");
  const metaNodeToken = MetaNodeToken.attach(metaNodeTokenAddress);

  console.log("\n========== Uniswap集成测试 ==========");
  console.log("MetaStake合约地址:", metaStakeAddress);
  console.log("MetaNode代币地址:", metaNodeTokenAddress);
  console.log("====================================\n");

  // 检查Uniswap Router配置
  const uniswapRouter = await metaStake.uniswapRouter();
  if (uniswapRouter === ethers.ZeroAddress) {
    console.log(" Uniswap Router未配置");
    console.log("\n请使用以下命令设置Uniswap Router:");
    console.log("  export UNISWAP_ROUTER=0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008");
    console.log("  npm run set-router:sepolia");
    process.exit(1);
  }

  console.log("✓ Uniswap Router已配置:", uniswapRouter);

  // 获取WETH地址
  const IUniswapV2Router02 = await ethers.getContractAt("IUniswapV2Router02", uniswapRouter);
  let wethAddress;
  try {
    wethAddress = await IUniswapV2Router02.WETH();
    console.log("✓ WETH地址:", wethAddress);
  } catch (error) {
    console.log("⚠ 无法获取WETH地址:", error.message);
  }

  // 测试预估交换输出（交换成ETH）
  console.log("\n========== 测试预估交换输出 ==========");
  const testAmounts = [
    ethers.parseEther("1"),
    ethers.parseEther("10"),
    ethers.parseEther("100"),
    ethers.parseEther("1000"),
  ];

  console.log("\n1. 预估MetaNode -> ETH:");
  for (const amount of testAmounts) {
    try {
      const estimatedETH = await metaStake.getSwapAmountOut(amount, ethers.ZeroAddress);
      console.log(`  ${ethers.formatEther(amount)} MNODE -> ${ethers.formatEther(estimatedETH)} ETH`);
    } catch (error) {
      console.log(`  ${ethers.formatEther(amount)} MNODE -> 错误: ${error.message}`);
    }
  }

  // 如果提供了输出代币地址，测试交换成ERC20代币
  const outputTokenAddress = process.env.OUTPUT_TOKEN_ADDRESS;
  if (outputTokenAddress && outputTokenAddress !== "") {
    console.log(`\n2. 预估MetaNode -> Token (${outputTokenAddress}):`);
    for (const amount of testAmounts) {
      try {
        const estimatedToken = await metaStake.getSwapAmountOut(amount, outputTokenAddress);
        console.log(`  ${ethers.formatEther(amount)} MNODE -> ${ethers.formatEther(estimatedToken)} Token`);
      } catch (error) {
        console.log(`  ${ethers.formatEther(amount)} MNODE -> 错误: ${error.message}`);
      }
    }
  } else {
    console.log("\n2. 跳过ERC20代币预估（未设置OUTPUT_TOKEN_ADDRESS环境变量）");
  }

  console.log("\n====================================\n");

  // 显示使用说明
  console.log("========== 使用说明 ==========");
  console.log("1. 领取并交换成ETH:");
  console.log("   const deadline = Math.floor(Date.now() / 1000) + 3600;");
  console.log("   const estimatedETH = await metaStake.getSwapAmountOut(amount, ethers.ZeroAddress);");
  console.log("   await metaStake.claimAndSwap(poolId, ethers.ZeroAddress, estimatedETH * 90n / 100n, deadline);");
  console.log("\n2. 领取并交换成ERC20代币:");
  console.log("   const tokenAddress = '0x...';");
  console.log("   const estimatedToken = await metaStake.getSwapAmountOut(amount, tokenAddress);");
  console.log("   await metaStake.claimAndSwap(poolId, tokenAddress, estimatedToken * 90n / 100n, deadline);");
  console.log("==============================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n测试失败:");
    console.error(error);
    process.exit(1);
  });

