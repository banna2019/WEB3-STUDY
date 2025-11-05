const hre = require("hardhat");

/**
 * Voting 合约交互式测试脚本
 * 用于在本地 Hardhat 网络上测试 Voting 合约的所有功能
 */
async function main() {
  console.log("🚀 开始 Voting 合约交互式测试...\n");

  // 获取测试账户
  const [owner, voter1, voter2, voter3, voter4] = await hre.ethers.getSigners();
  
  console.log("📋 测试账户信息:");
  console.log("  所有者 (owner):", owner.address);
  console.log("  投票者 1:", voter1.address);
  console.log("  投票者 2:", voter2.address);
  console.log("  投票者 3:", voter3.address);
  console.log("  投票者 4:", voter4.address);
  console.log("");

  // 部署合约
  console.log("📦 正在部署 Voting 合约...");
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  const votingAddress = await voting.getAddress();
  console.log("✅ Voting 合约部署成功!");
  console.log("📍 合约地址:", votingAddress);
  console.log("");

  // 测试 1: 检查初始状态
  console.log("=".repeat(60));
  console.log("📌 测试 1: 检查初始状态");
  console.log("=".repeat(60));
  const ownerAddress = await voting.owner();
  console.log("✅ 合约所有者:", ownerAddress);
  console.log("✅ 初始候选人数量:", (await voting.getCandidateCount()).toString());
  console.log("✅ voter1 投票状态:", await voting.checkHasVoted(voter1.address));
  console.log("");

  // 测试 2: 投票功能
  console.log("=".repeat(60));
  console.log("📌 测试 2: 投票功能");
  console.log("=".repeat(60));
  
  console.log("🔵 voter1 投票给 Alice...");
  const tx1 = await voting.connect(voter1).vote("Alice");
  await tx1.wait();
  console.log("✅ 投票成功!");
  console.log("   Alice 得票数:", (await voting.getVotes("Alice")).toString());
  console.log("   voter1 投票状态:", await voting.checkHasVoted(voter1.address));
  console.log("");

  console.log("🔵 voter2 投票给 Bob...");
  const tx2 = await voting.connect(voter2).vote("Bob");
  await tx2.wait();
  console.log("✅ 投票成功!");
  console.log("   Bob 得票数:", (await voting.getVotes("Bob")).toString());
  console.log("");

  console.log("🔵 voter3 投票给 Alice...");
  const tx3 = await voting.connect(voter3).vote("Alice");
  await tx3.wait();
  console.log("✅ 投票成功!");
  console.log("   Alice 得票数:", (await voting.getVotes("Alice")).toString());
  console.log("");

  console.log("🔵 voter4 投票给 Charlie...");
  const tx4 = await voting.connect(voter4).vote("Charlie");
  await tx4.wait();
  console.log("✅ 投票成功!");
  console.log("   Charlie 得票数:", (await voting.getVotes("Charlie")).toString());
  console.log("");

  // 测试 3: 查询功能
  console.log("=".repeat(60));
  console.log("📌 测试 3: 查询功能");
  console.log("=".repeat(60));
  
  const candidateCount = await voting.getCandidateCount();
  console.log("✅ 候选人总数:", candidateCount.toString());
  console.log("");

  console.log("📊 所有候选人得票情况:");
  for (let i = 0; i < candidateCount; i++) {
    const candidate = await voting.getCandidate(i);
    const votes = await voting.getVotes(candidate);
    console.log(`   ${i + 1}. ${candidate}: ${votes} 票`);
  }
  console.log("");

  // 测试 4: 防止重复投票
  console.log("=".repeat(60));
  console.log("📌 测试 4: 防止重复投票");
  console.log("=".repeat(60));
  
  console.log("🔴 尝试让 voter1 再次投票...");
  try {
    await voting.connect(voter1).vote("Bob");
    console.log("❌ 错误: 应该阻止重复投票");
  } catch (error) {
    console.log("✅ 正确阻止了重复投票");
    console.log("   错误信息:", error.message);
  }
  console.log("");

  // 测试 5: 重置功能
  console.log("=".repeat(60));
  console.log("📌 测试 5: 重置功能");
  console.log("=".repeat(60));
  
  console.log("🔵 所有者重置所有投票...");
  const resetTx = await voting.connect(owner).resetVotes();
  await resetTx.wait();
  console.log("✅ 重置成功!");
  console.log("");

  console.log("📊 重置后的得票情况:");
  for (let i = 0; i < candidateCount; i++) {
    const candidate = await voting.getCandidate(i);
    const votes = await voting.getVotes(candidate);
    console.log(`   ${candidate}: ${votes} 票`);
  }
  console.log("");

  // 测试 6: 重置投票者状态
  console.log("=".repeat(60));
  console.log("📌 测试 6: 重置投票者状态");
  console.log("=".repeat(60));
  
  console.log("🔵 所有者重置 voter1 的投票状态...");
  await voting.connect(owner).resetVoterStatus(voter1.address);
  console.log("✅ voter1 投票状态:", await voting.checkHasVoted(voter1.address));
  console.log("");

  console.log("🔵 voter1 现在可以再次投票...");
  const tx5 = await voting.connect(voter1).vote("David");
  await tx5.wait();
  console.log("✅ 投票成功!");
  console.log("   David 得票数:", (await voting.getVotes("David")).toString());
  console.log("");

  // 测试 7: 权限控制
  console.log("=".repeat(60));
  console.log("📌 测试 7: 权限控制");
  console.log("=".repeat(60));
  
  console.log("🔴 尝试让非所有者重置投票...");
  try {
    await voting.connect(voter2).resetVotes();
    console.log("❌ 错误: 应该阻止非所有者操作");
  } catch (error) {
    console.log("✅ 正确阻止了非所有者操作");
    console.log("   错误信息:", error.message);
  }
  console.log("");

  // 测试 8: 边界情况
  console.log("=".repeat(60));
  console.log("📌 测试 8: 边界情况");
  console.log("=".repeat(60));
  
  console.log("🔴 尝试使用空字符串作为候选人名称...");
  try {
    const [, , , , , voter5] = await hre.ethers.getSigners();
    await voting.connect(voter5).vote("");
    console.log("❌ 错误: 应该拒绝空字符串");
  } catch (error) {
    console.log("✅ 正确拒绝了空字符串");
    console.log("   错误信息:", error.message);
  }
  console.log("");

  console.log("🔴 尝试获取超出范围的候选人索引...");
  try {
    await voting.getCandidate(100);
    console.log("❌ 错误: 应该拒绝超出范围的索引");
  } catch (error) {
    console.log("✅ 正确拒绝了超出范围的索引");
    console.log("   错误信息:", error.message);
  }
  console.log("");

  // 最终统计
  console.log("=".repeat(60));
  console.log("📊 最终统计");
  console.log("=".repeat(60));
  
  const finalCandidateCount = await voting.getCandidateCount();
  console.log("✅ 候选人总数:", finalCandidateCount.toString());
  console.log("");

  console.log("📊 最终得票情况:");
  for (let i = 0; i < finalCandidateCount; i++) {
    const candidate = await voting.getCandidate(i);
    const votes = await voting.getVotes(candidate);
    console.log(`   ${candidate}: ${votes} 票`);
  }
  console.log("");

  console.log("✅ 所有测试完成!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  });

