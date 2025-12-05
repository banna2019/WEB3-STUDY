const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * 添加新的质押池脚本
 * 使用方法: 
 *   npx hardhat run scripts/addPool.js --network sepolia
 * 
 * 环境变量:
 *   META_STAKE_ADDRESS - MetaStake合约地址（必需）
 *   ST_TOKEN_ADDRESS - 质押代币地址，address(0)表示native currency（可选，默认0x0）
 *   POOL_WEIGHT - 池权重（可选，默认1）
 *   MIN_DEPOSIT - 最小质押金额（可选，默认0.1）
 *   UNSTAKE_LOCKED_BLOCKS - 解质押锁定区块数（可选，默认100）
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("操作账户:", deployer.address);
  console.log("网络:", network.name);
  console.log("链ID:", (await ethers.provider.getNetwork()).chainId.toString());

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
    console.error("错误: 请设置META_STAKE_ADDRESS环境变量");
    console.error("或者确保deployments目录中有对应网络的部署文件");
    process.exit(1);
  }

  await addPool(metaStakeAddress, deployer);
}

async function addPool(metaStakeAddress, deployer) {
  const MetaStake = await ethers.getContractFactory("MetaStake");
  const metaStake = MetaStake.attach(metaStakeAddress);

  // 验证合约地址
  const code = await ethers.provider.getCode(metaStakeAddress);
  if (code === "0x") {
    console.error("错误: MetaStake合约地址无效");
    process.exit(1);
  }

  // 获取当前池数量
  const totalPoolsBefore = await metaStake.totalPools();
  console.log("当前池数量:", totalPoolsBefore.toString());

  // 配置参数
  const ST_TOKEN_ADDRESS = process.env.ST_TOKEN_ADDRESS || ethers.ZeroAddress;
  const POOL_WEIGHT = ethers.parseEther(process.env.POOL_WEIGHT || "1");
  const MIN_DEPOSIT = ethers.parseEther(process.env.MIN_DEPOSIT || "0.1");
  const UNSTAKE_LOCKED_BLOCKS = parseInt(process.env.UNSTAKE_LOCKED_BLOCKS || "100");

  console.log("\n========== 添加质押池配置 ==========");
  console.log("MetaStake合约地址:", metaStakeAddress);
  console.log("质押代币地址:", ST_TOKEN_ADDRESS === ethers.ZeroAddress ? "Native Currency (ETH)" : ST_TOKEN_ADDRESS);
  console.log("池权重:", ethers.formatEther(POOL_WEIGHT));
  console.log("最小质押金额:", ethers.formatEther(MIN_DEPOSIT));
  console.log("解质押锁定区块数:", UNSTAKE_LOCKED_BLOCKS);
  console.log("====================================\n");

  // 如果是ERC20代币，检查地址
  if (ST_TOKEN_ADDRESS !== ethers.ZeroAddress) {
    const tokenCode = await ethers.provider.getCode(ST_TOKEN_ADDRESS);
    if (tokenCode === "0x") {
      console.error("错误: 指定的代币地址不是合约地址");
      process.exit(1);
    }
    
    // 尝试获取代币信息
    try {
      const token = await ethers.getContractAt("IERC20", ST_TOKEN_ADDRESS);
      // 如果代币有name和symbol方法，尝试调用
      try {
        const name = await token.name();
        const symbol = await token.symbol();
        console.log(`代币信息: ${name} (${symbol})`);
      } catch {
        console.log("代币地址验证通过");
      }
    } catch (error) {
      console.log("警告: 无法验证代币合约");
    }
  }

  // 添加池
  console.log("发送交易...");
  const tx = await metaStake.addPool(
    ST_TOKEN_ADDRESS,
    POOL_WEIGHT,
    MIN_DEPOSIT,
    UNSTAKE_LOCKED_BLOCKS
  );
  
  console.log("交易哈希:", tx.hash);
  console.log("等待确认...");
  const receipt = await tx.wait();
  console.log("✓ 交易已确认，区块:", receipt.blockNumber);
  
  // 查找PoolAdded事件
  const poolAddedEvent = receipt.logs.find(
    log => {
      try {
        const parsed = metaStake.interface.parseLog(log);
        return parsed && parsed.name === "PoolAdded";
      } catch {
        return false;
      }
    }
  );

  if (poolAddedEvent) {
    const parsed = metaStake.interface.parseLog(poolAddedEvent);
    const poolId = parsed.args[0];
    const stTokenAddress = parsed.args[1];
    const poolWeight = parsed.args[2];
    
    console.log("\n========== 池添加成功 ==========");
    console.log("池ID:", poolId.toString());
    console.log("质押代币地址:", stTokenAddress);
    console.log("池权重:", ethers.formatEther(poolWeight));
    console.log("==============================\n");

    // 验证池信息
    const pool = await metaStake.pools(poolId);
    console.log("池信息验证:");
    console.log("  - 质押代币地址:", pool.stakeTokenAddress === ethers.ZeroAddress ? "Native Currency (ETH)" : pool.stakeTokenAddress);
    console.log("  - 池权重:", ethers.formatEther(pool.poolWeight));
    console.log("  - 最小质押金额:", ethers.formatEther(pool.minDepositAmount));
    console.log("  - 解质押锁定区块数:", pool.unstakeLockedBlocks.toString());
    console.log("  - 总质押量:", ethers.formatEther(pool.stakeTokenAmount));
    console.log("  - 最后奖励区块:", pool.lastRewardBlock.toString());

    // 更新部署文件
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
    
    if (fs.existsSync(deploymentFile)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
      if (!deploymentInfo.pools) {
        deploymentInfo.pools = [];
      }
      deploymentInfo.pools.push({
        pid: poolId.toString(),
        stakeTokenAddress: stTokenAddress,
        poolWeight: ethers.formatEther(poolWeight),
        minDepositAmount: ethers.formatEther(pool.minDepositAmount),
        unstakeLockedBlocks: pool.unstakeLockedBlocks.toString(),
        addedAt: new Date().toISOString(),
      });
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
      console.log("\n✓ 部署文件已更新");
    }
  } else {
    console.log("警告: 未找到PoolAdded事件");
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

