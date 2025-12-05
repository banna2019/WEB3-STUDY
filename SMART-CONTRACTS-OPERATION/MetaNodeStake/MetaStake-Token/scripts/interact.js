const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * 交互脚本 - 查询合约状态
 * 使用方法: npx hardhat run scripts/interact.js --network sepolia
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("查询账户:", deployer.address);
  console.log("网络:", network.name);

  // 从部署文件读取合约地址
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("错误: 未找到部署文件:", deploymentFile);
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  // 优先使用环境变量中的地址，如果没有则从部署文件读取
  const metaStakeAddress = process.env.META_STAKE_ADDRESS || deploymentInfo.contracts.metaStake;
  const metaNodeTokenAddress = process.env.META_NODE_TOKEN_ADDRESS || deploymentInfo.contracts.metaNodeToken;
  const implementationAddress = process.env.IMPLEMENTATION_ADDRESS || deploymentInfo.contracts.implementation;

  const MetaStake = await ethers.getContractFactory("MetaStake");
  const metaStake = MetaStake.attach(metaStakeAddress);

  const MetaNodeToken = await ethers.getContractFactory("MetaNodeToken");
  const metaNodeToken = MetaNodeToken.attach(metaNodeTokenAddress);

  console.log("\n========== 合约信息 ==========");
  console.log("MetaStake地址:", metaStakeAddress);
  console.log("MetaNode代币地址:", metaNodeTokenAddress);
  if (implementationAddress) {
    console.log("实现合约地址:", implementationAddress);
  }
  console.log("============================\n");

  // 查询基本配置
  console.log("========== 基本配置 ==========");
  const metaNodePerBlock = await metaStake.metaNodePerBlock();
  const startBlock = await metaStake.startBlock();
  const totalPools = await metaStake.totalPools();
  const currentBlock = await ethers.provider.getBlockNumber();

  console.log("每个区块奖励:", ethers.formatEther(metaNodePerBlock), "MNODE");
  console.log("开始区块:", startBlock.toString());
  console.log("当前区块:", currentBlock.toString());
  console.log("总池数:", totalPools.toString());
  console.log("============================\n");

  // 查询MetaNode代币余额
  const contractBalance = await metaNodeToken.balanceOf(metaStakeAddress);
  console.log("MetaStake合约MetaNode余额:", ethers.formatEther(contractBalance), "MNODE\n");

  // 查询Uniswap Router信息
  console.log("========== Uniswap配置 ==========");
  const uniswapRouter = await metaStake.uniswapRouter();
  if (uniswapRouter !== ethers.ZeroAddress) {
    console.log("Uniswap Router地址:", uniswapRouter);
    console.log("状态: 已配置");
  } else {
    console.log("Uniswap Router地址: 未设置");
    console.log("状态: 未配置");
    console.log("提示: 使用setUniswapRouter函数设置Router地址以启用交换功能");
  }
  console.log("================================\n");

  // 查询所有池信息
  console.log("========== 池信息 ==========");
  for (let i = 0; i < totalPools; i++) {
    const pool = await metaStake.pools(i);
    console.log(`\n池 ${i}:`);
    console.log("  质押代币地址:", pool.stakeTokenAddress === ethers.ZeroAddress ? "Native Currency (ETH)" : pool.stakeTokenAddress);
    console.log("  池权重:", ethers.formatEther(pool.poolWeight));
    console.log("  总质押量:", ethers.formatEther(pool.stakeTokenAmount));
    console.log("  最小质押金额:", ethers.formatEther(pool.minDepositAmount));
    console.log("  解质押锁定区块数:", pool.unstakeLockedBlocks.toString());
    console.log("  最后奖励区块:", pool.lastRewardBlock.toString());
    console.log("  累积奖励/质押代币:", ethers.formatEther(pool.accMetaNodePerST));
  }
  console.log("============================\n");

  // 查询用户信息（如果提供了用户地址）
  const userAddress = process.env.USER_ADDRESS || deployer.address;
  if (userAddress) {
    console.log("========== 用户信息 ==========");
    console.log("用户地址:", userAddress);
    
    for (let i = 0; i < totalPools; i++) {
      const user = await metaStake.users(i, userAddress);
      const pendingReward = await metaStake.pendingReward(i, userAddress);
      const requestCount = await metaStake.getUserRequestCount(i, userAddress);

      if (user.stAmount > 0 || pendingReward > 0 || requestCount > 0) {
        console.log(`\n池 ${i}:`);
        console.log("  质押数量:", ethers.formatEther(user.stAmount));
        console.log("  待领取奖励:", ethers.formatEther(pendingReward), "MNODE");
        console.log("  解质押请求数:", requestCount.toString());

        if (requestCount > 0) {
          console.log("  解质押请求详情:");
          for (let j = 0; j < requestCount; j++) {
            const request = await metaStake.getUserRequest(i, userAddress, j);
            const isUnlocked = currentBlock >= request.unlockBlock;
            console.log(`    请求 ${j}:`);
            console.log(`      数量: ${ethers.formatEther(request.amount)}`);
            console.log(`      解锁区块: ${request.unlockBlock.toString()}`);
            console.log(`      状态: ${isUnlocked ? "可提取" : "锁定中"}`);
          }
        }
      }
    }
    console.log("============================\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

