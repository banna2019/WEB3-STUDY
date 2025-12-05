const { run, ethers } = require("hardhat");

/**
 * 验证合约脚本
 * 使用方法: npx hardhat run scripts/verify.js --network sepolia
 */
async function main() {
  const network = await ethers.provider.getNetwork();
  console.log("网络:", network.name);
  console.log("链ID:", network.chainId.toString());

  // 从部署文件读取合约地址
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("错误: 未找到部署文件:", deploymentFile);
    console.error("请先运行部署脚本");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  // 优先使用环境变量中的地址，如果没有则从部署文件读取
  const metaNodeToken = process.env.META_NODE_TOKEN_ADDRESS || deploymentInfo.contracts.metaNodeToken;
  const metaStake = process.env.META_STAKE_ADDRESS || deploymentInfo.contracts.metaStake;
  const implementation = process.env.IMPLEMENTATION_ADDRESS || deploymentInfo.contracts.implementation;

  console.log("\n========== 验证合约 ==========");
  console.log("MetaNode代币地址:", metaNodeToken);
  console.log("MetaStake合约地址:", metaStake);
  console.log("实现合约地址:", implementation);
  console.log("============================\n");

  try {
    // 验证MetaNode代币
    console.log("验证MetaNode代币...");
    await run("verify:verify", {
      address: metaNodeToken,
      constructorArguments: [deploymentInfo.deployer],
    });
    console.log("✓ MetaNode代币验证成功\n");
  } catch (error) {
    console.log("MetaNode代币验证失败:", error.message);
  }

  try {
    // 验证实现合约
    console.log("验证实现合约...");
    await run("verify:verify", {
      address: implementation,
      constructorArguments: [],
    });
    console.log("✓ 实现合约验证成功\n");
  } catch (error) {
    console.log("实现合约验证失败:", error.message);
  }

  console.log("注意: 代理合约地址不需要单独验证");
  console.log("验证实现合约后，代理合约会自动关联");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

