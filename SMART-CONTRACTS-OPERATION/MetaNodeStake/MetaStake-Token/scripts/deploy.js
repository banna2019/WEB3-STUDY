const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * 根据网络信息获取 Etherscan 链接
 * @param {string} address 合约地址
 * @param {number} chainId 链ID
 * @param {string} networkName 网络名称
 * @returns {string} Etherscan 链接
 */
function getEtherscanUrl(address, chainId, networkName) {
  const networkMap = {
    1: "https://etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    5: "https://goerli.etherscan.io",
    42161: "https://arbiscan.io",
    10: "https://optimistic.etherscan.io",
    137: "https://polygonscan.com",
    56: "https://bscscan.com",
    43114: "https://snowtrace.io",
  };

  const nameMap = {
    mainnet: "https://etherscan.io",
    sepolia: "https://sepolia.etherscan.io",
    goerli: "https://goerli.etherscan.io",
    arbitrum: "https://arbiscan.io",
    optimism: "https://optimistic.etherscan.io",
    polygon: "https://polygonscan.com",
    bsc: "https://bscscan.com",
    avalanche: "https://snowtrace.io",
  };

  let baseUrl = "";
  
  if (networkName && nameMap[networkName.toLowerCase()]) {
    baseUrl = nameMap[networkName.toLowerCase()];
  } else if (chainId && networkMap[chainId]) {
    baseUrl = networkMap[chainId];
  }
  
  if (!baseUrl || networkName === "localhost" || networkName === "hardhat") {
    return "";
  }

  return `${baseUrl}/address/${address}`;
}

/**
 * 更新 .env 文件中的环境变量
 * @param {string} key 环境变量键名
 * @param {string} value 环境变量值
 */
function updateEnvFile(key, value) {
  const envPath = path.join(__dirname, "..", ".env");
  const envExamplePath = path.join(__dirname, "..", ".env.example");
  
  // 如果.env文件不存在，从.env.example复制
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log(`✓ 已从.env.example创建.env文件`);
    } else {
      // 如果.env.example也不存在，创建新的.env文件
      fs.writeFileSync(envPath, `# MetaStake-Token 环境变量配置\n# 自动生成于: ${new Date().toISOString()}\n\n`);
    }
  }

  let envContent = fs.readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");
  let found = false;

  // 查找并更新现有的环境变量
  const updatedLines = lines.map((line) => {
    // 匹配键名（支持注释和空行）
    const match = line.match(/^([^#=]*?)(\s*=\s*)(.*)$/);
    if (match) {
      const lineKey = match[1].trim();
      if (lineKey === key) {
        found = true;
        return `${key}=${value}`;
      }
    }
    return line;
  });

  // 如果没有找到，添加到文件末尾
  if (!found) {
    updatedLines.push(`${key}=${value}`);
  }

  envContent = updatedLines.join("\n");
  fs.writeFileSync(envPath, envContent, "utf8");
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("网络:", network.name);
  console.log("链ID:", (await ethers.provider.getNetwork()).chainId.toString());

  // 从环境变量读取配置，如果没有则使用默认值
  const META_NODE_PER_BLOCK = process.env.META_NODE_PER_BLOCK 
    ? ethers.parseEther(process.env.META_NODE_PER_BLOCK) 
    : ethers.parseEther("1"); // 默认1 MNODE per block
  
  const REWARD_AMOUNT = process.env.REWARD_AMOUNT 
    ? ethers.parseEther(process.env.REWARD_AMOUNT) 
    : ethers.parseEther("1000000"); // 默认100万MNODE
  
  const MIN_DEPOSIT = process.env.MIN_DEPOSIT 
    ? ethers.parseEther(process.env.MIN_DEPOSIT) 
    : ethers.parseEther("0.1");
  
  const UNSTAKE_LOCKED_BLOCKS = process.env.UNSTAKE_LOCKED_BLOCKS 
    ? parseInt(process.env.UNSTAKE_LOCKED_BLOCKS) 
    : 100;
  
  const POOL_WEIGHT = process.env.POOL_WEIGHT 
    ? ethers.parseEther(process.env.POOL_WEIGHT) 
    : ethers.parseEther("1");

  // Uniswap Router地址（可选）
  const UNISWAP_ROUTER = process.env.UNISWAP_ROUTER || "";

  // 部署MetaNode代币
  console.log("\n========== 步骤 1: 部署MetaNode代币 ==========");
  const MetaNodeToken = await ethers.getContractFactory("MetaNodeToken");
  const metaNodeToken = await MetaNodeToken.deploy(deployer.address);
  await metaNodeToken.waitForDeployment();
  const metaNodeTokenAddress = await metaNodeToken.getAddress();
  console.log("✓ MetaNode代币地址:", metaNodeTokenAddress);
  
  // 等待几个区块确认
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("等待区块确认...");
    await metaNodeToken.deploymentTransaction()?.wait(3);
  }

  // 部署MetaStake合约（使用代理）
  console.log("\n========== 步骤 2: 部署MetaStake合约 ==========");
  const MetaStake = await ethers.getContractFactory("MetaStake");
  
  const startBlock = await ethers.provider.getBlockNumber();
  console.log("开始区块:", startBlock);
  console.log("每个区块奖励:", ethers.formatEther(META_NODE_PER_BLOCK), "MNODE");
  
  const metaStake = await upgrades.deployProxy(
    MetaStake,
    [
      metaNodeTokenAddress,
      META_NODE_PER_BLOCK,
      startBlock,
      deployer.address, // admin
    ],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );
  await metaStake.waitForDeployment();
  const metaStakeAddress = await metaStake.getAddress();
  console.log("✓ MetaStake合约地址:", metaStakeAddress);
  
  // 获取实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(metaStakeAddress);
  console.log("✓ 实现合约地址:", implementationAddress);

  // 等待区块确认
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("等待区块确认...");
    await metaStake.deploymentTransaction()?.wait(3);
  }

  // 给MetaStake合约铸造一些MetaNode代币作为奖励
  console.log("\n========== 步骤 3: 铸造奖励代币 ==========");
  const rewardAmount = REWARD_AMOUNT;
  const txMint = await metaNodeToken.mint(metaStakeAddress, rewardAmount);
  await txMint.wait();
  console.log("✓ 已铸造", ethers.formatEther(rewardAmount), "MNODE到MetaStake合约");
  
  // 验证余额
  const contractBalance = await metaNodeToken.balanceOf(metaStakeAddress);
  console.log("✓ MetaStake合约MetaNode余额:", ethers.formatEther(contractBalance), "MNODE");

  // 添加第一个池（Native currency池）
  console.log("\n========== 步骤 4: 添加Native currency质押池 ==========");
  const txAddPool = await metaStake.addPool(
    ethers.ZeroAddress, // address(0)表示native currency
    POOL_WEIGHT,
    MIN_DEPOSIT,
    UNSTAKE_LOCKED_BLOCKS
  );
  await txAddPool.wait();
  console.log("✓ 已添加Native currency池 (池ID: 0)");
  console.log("  - 池权重:", ethers.formatEther(POOL_WEIGHT));
  console.log("  - 最小质押金额:", ethers.formatEther(MIN_DEPOSIT), "ETH");
  console.log("  - 解质押锁定区块数:", UNSTAKE_LOCKED_BLOCKS);

  // 验证池信息
  const pool0 = await metaStake.pools(0);
  console.log("\n✓ 池0验证:");
  console.log("  - 质押代币地址:", pool0.stakeTokenAddress === ethers.ZeroAddress ? "Native Currency (ETH)" : pool0.stakeTokenAddress);
  console.log("  - 池权重:", ethers.formatEther(pool0.poolWeight));
  console.log("  - 最小质押金额:", ethers.formatEther(pool0.minDepositAmount));
  console.log("  - 解质押锁定区块数:", pool0.unstakeLockedBlocks.toString());

  // 设置Uniswap Router（如果提供）
  if (UNISWAP_ROUTER && UNISWAP_ROUTER !== "") {
    console.log("\n========== 步骤 5: 设置Uniswap Router ==========");
    const txSetRouter = await metaStake.connect(deployer).setUniswapRouter(UNISWAP_ROUTER);
    await txSetRouter.wait();
    console.log("✓ Uniswap Router已设置:", UNISWAP_ROUTER);
    
    const routerAddress = await metaStake.uniswapRouter();
    console.log("✓ 验证Router地址:", routerAddress);
  } else {
    console.log("\n========== 步骤 5: 跳过Uniswap Router设置 ==========");
    console.log("提示: 可以通过setUniswapRouter函数稍后设置Router地址");
  }

  // 获取链ID和网络名称用于生成Etherscan链接
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const networkName = network.name;

  // 更新.env文件中的合约地址
  console.log("\n========== 更新环境变量 ==========");
  try {
    updateEnvFile("META_NODE_TOKEN_ADDRESS", metaNodeTokenAddress);
    console.log("✓ 已更新 META_NODE_TOKEN_ADDRESS");
    
    updateEnvFile("META_STAKE_ADDRESS", metaStakeAddress);
    console.log("✓ 已更新 META_STAKE_ADDRESS");
    
    updateEnvFile("IMPLEMENTATION_ADDRESS", implementationAddress);
    console.log("✓ 已更新 IMPLEMENTATION_ADDRESS");
  } catch (error) {
    console.warn("⚠ 更新.env文件时出错:", error.message);
  }
  console.log("================================\n");

  // 打印部署信息
  console.log("\n========== 部署完成 ==========");
  console.log("网络:", networkName);
  console.log("链ID:", chainId.toString());
  console.log("部署账户:", deployer.address);
  console.log("\n合约地址:");
  console.log("  MetaNode代币:", metaNodeTokenAddress);
  console.log("  MetaStake合约:", metaStakeAddress);
  console.log("  实现合约:", implementationAddress);
  
  // 输出Etherscan链接（仅对非本地网络）
  const metaNodeTokenUrl = getEtherscanUrl(metaNodeTokenAddress, chainId, networkName);
  const metaStakeUrl = getEtherscanUrl(metaStakeAddress, chainId, networkName);
  const implementationUrl = getEtherscanUrl(implementationAddress, chainId, networkName);
  
  // 只有当至少有一个有效的Etherscan链接时才显示这部分
  if (metaNodeTokenUrl || metaStakeUrl || implementationUrl) {
    console.log("\nEtherscan 访问链接:");
    if (metaNodeTokenUrl) {
      console.log("  MetaNode代币:", metaNodeTokenUrl);
    }
    if (metaStakeUrl) {
      console.log("  MetaStake合约:", metaStakeUrl);
    }
    if (implementationUrl) {
      console.log("  实现合约:", implementationUrl);
    }
  }
  
  console.log("\n配置参数:");
  console.log("  每个区块奖励:", ethers.formatEther(META_NODE_PER_BLOCK), "MNODE");
  console.log("  开始区块:", startBlock);
  console.log("  奖励代币总量:", ethers.formatEther(rewardAmount), "MNODE");
  console.log("  最小质押金额:", ethers.formatEther(MIN_DEPOSIT), "ETH");
  console.log("  解质押锁定区块数:", UNSTAKE_LOCKED_BLOCKS);
  if (UNISWAP_ROUTER && UNISWAP_ROUTER !== "") {
    console.log("  Uniswap Router:", UNISWAP_ROUTER, "(已配置)");
  } else {
    console.log("  Uniswap Router: 未配置");
  }
  console.log("================================\n");

  // 保存部署信息到文件
  const deploymentInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    deployTime: new Date().toISOString(),
    contracts: {
      metaNodeToken: metaNodeTokenAddress,
      metaStake: metaStakeAddress,
      implementation: implementationAddress,
    },
    config: {
      metaNodePerBlock: ethers.formatEther(META_NODE_PER_BLOCK),
      startBlock: startBlock.toString(),
      rewardAmount: ethers.formatEther(rewardAmount),
      minDeposit: ethers.formatEther(MIN_DEPOSIT),
      unstakeLockedBlocks: UNSTAKE_LOCKED_BLOCKS.toString(),
    },
    pools: [
      {
        pid: 0,
        stakeTokenAddress: ethers.ZeroAddress,
        poolWeight: ethers.formatEther(POOL_WEIGHT),
        minDepositAmount: ethers.formatEther(MIN_DEPOSIT),
        unstakeLockedBlocks: UNSTAKE_LOCKED_BLOCKS.toString(),
      }
    ],
    uniswapRouter: UNISWAP_ROUTER && UNISWAP_ROUTER !== "" ? UNISWAP_ROUTER : null,
    uniswapRouterConfigured: UNISWAP_ROUTER && UNISWAP_ROUTER !== "" ? true : false
  };

  // 保存到deployments目录
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("✓ 部署信息已保存到:", deploymentFile);

  // 打印JSON格式的部署信息（方便复制）
  console.log("\n部署信息 (JSON):");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // 如果配置了Etherscan API Key，提示验证合约
  if (network.name !== "hardhat" && network.name !== "localhost" && process.env.ETHERSCAN_API_KEY) {
    console.log("\n========== 合约验证提示 ==========");
    console.log("可以使用以下命令验证合约:");
    console.log(`npx hardhat verify --network ${network.name} ${metaNodeTokenAddress} "${deployer.address}"`);
    console.log(`npx hardhat verify --network ${network.name} ${implementationAddress}`);
    console.log("================================\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n部署失败:");
    console.error(error);
    process.exit(1);
  });

