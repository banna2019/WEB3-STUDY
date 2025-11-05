const hre = require("hardhat");

/**
 * MergeSortedArrays 合约交互式测试脚本
 * 用于在本地 Hardhat 网络上测试 MergeSortedArrays 合约的所有功能
 */
async function main() {
  console.log("🚀 开始 MergeSortedArrays 合约交互式测试...\n");

  // 获取测试账户
  const [owner] = await hre.ethers.getSigners();
  
  console.log("📋 测试账户信息:");
  console.log("  账户:", owner.address);
  console.log("");

  // 部署合约
  console.log("📦 正在部署 MergeSortedArrays 合约...");
  const MergeSortedArrays = await hre.ethers.getContractFactory("MergeSortedArrays");
  const mergeSortedArrays = await MergeSortedArrays.deploy();
  await mergeSortedArrays.waitForDeployment();
  const mergeSortedArraysAddress = await mergeSortedArrays.getAddress();
  console.log("✅ MergeSortedArrays 合约部署成功!");
  console.log("📍 合约地址:", mergeSortedArraysAddress);
  console.log("");

  // 测试 1: 基本合并功能
  console.log("=".repeat(60));
  console.log("📌 测试 1: 基本合并功能");
  console.log("=".repeat(60));
  
  const testCases = [
    { nums1: [1, 2, 3], nums2: [4, 5, 6], expected: [1, 2, 3, 4, 5, 6] },
    { nums1: [1, 3, 5], nums2: [2, 4, 6], expected: [1, 2, 3, 4, 5, 6] },
    { nums1: [1, 2, 3], nums2: [2, 3, 4], expected: [1, 2, 2, 3, 3, 4] },
  ];

  for (const testCase of testCases) {
    const result = await mergeSortedArrays.mergeSortedArrays(testCase.nums1, testCase.nums2);
    const resultNumbers = result.map(v => Number(v));
    const status = JSON.stringify(resultNumbers) === JSON.stringify(testCase.expected) ? "✅" : "❌";
    console.log(`${status} 合并 [${testCase.nums1.join(", ")}] 和 [${testCase.nums2.join(", ")}]`);
    console.log(`   结果: [${resultNumbers.join(", ")}] (期望: [${testCase.expected.join(", ")}])`);
  }
  console.log("");

  // 测试 2: 边界情况
  console.log("=".repeat(60));
  console.log("📌 测试 2: 边界情况");
  console.log("=".repeat(60));
  
  console.log("🔵 测试空数组:");
  const empty1 = await mergeSortedArrays.mergeSortedArrays([], [1, 2, 3]);
  console.log(`  [] + [1, 2, 3] = [${empty1.map(v => Number(v)).join(", ")}]`);

  const empty2 = await mergeSortedArrays.mergeSortedArrays([1, 2, 3], []);
  console.log(`  [1, 2, 3] + [] = [${empty2.map(v => Number(v)).join(", ")}]`);

  const emptyBoth = await mergeSortedArrays.mergeSortedArrays([], []);
  console.log(`  [] + [] = [] (长度: ${emptyBoth.length})`);
  console.log("");

  // 测试 3: 不同长度数组
  console.log("=".repeat(60));
  console.log("📌 测试 3: 不同长度数组");
  console.log("=".repeat(60));
  
  const differentLength = await mergeSortedArrays.mergeSortedArrays([1, 3, 5, 7, 9], [2, 4]);
  console.log(`  合并 [1, 3, 5, 7, 9] 和 [2, 4]:`);
  console.log(`  结果: [${differentLength.map(v => Number(v)).join(", ")}]`);
  console.log("");

  // 测试 4: mergeMultipleArrays 函数
  console.log("=".repeat(60));
  console.log("📌 测试 4: mergeMultipleArrays 批量合并");
  console.log("=".repeat(60));
  
  const multipleArrays = [[1, 3], [2, 4], [5, 6]];
  const multipleResult = await mergeSortedArrays.mergeMultipleArrays(multipleArrays);
  console.log(`  合并多个数组: [[1, 3], [2, 4], [5, 6]]`);
  console.log(`  结果: [${multipleResult.map(v => Number(v)).join(", ")}]`);
  console.log("");

  // 测试 5: isSorted 函数
  console.log("=".repeat(60));
  console.log("📌 测试 5: isSorted 排序验证");
  console.log("=".repeat(60));
  
  const sortedArray = [1, 2, 3, 4, 5];
  const unsortedArray = [1, 3, 2, 4, 5];
  
  const isSorted1 = await mergeSortedArrays.isSorted(sortedArray);
  const isSorted2 = await mergeSortedArrays.isSorted(unsortedArray);
  
  console.log(`  [1, 2, 3, 4, 5] 是否已排序: ${isSorted1 ? "✅ 是" : "❌ 否"}`);
  console.log(`  [1, 3, 2, 4, 5] 是否已排序: ${isSorted2 ? "✅ 是" : "❌ 否"}`);
  
  // 验证合并后的数组是已排序的
  const merged = await mergeSortedArrays.mergeSortedArrays([1, 3, 5], [2, 4, 6]);
  const mergedIsSorted = await mergeSortedArrays.isSorted(merged);
  console.log(`  合并后的数组是否已排序: ${mergedIsSorted ? "✅ 是" : "❌ 否"}`);
  console.log("");

  // 测试 6: getMergedLength 函数
  console.log("=".repeat(60));
  console.log("📌 测试 6: getMergedLength 获取合并长度");
  console.log("=".repeat(60));
  
  const length = await mergeSortedArrays.getMergedLength([1, 2, 3], [4, 5]);
  console.log(`  [1, 2, 3] + [4, 5] 的合并长度: ${length}`);
  console.log("");

  // 测试 7: getMaxValue 函数
  console.log("=".repeat(60));
  console.log("📌 测试 7: getMaxValue 获取最大值");
  console.log("=".repeat(60));
  
  const maxValue = await mergeSortedArrays.getMaxValue([1, 3, 5], [2, 4, 8]);
  console.log(`  [1, 3, 5] 和 [2, 4, 8] 的最大值: ${maxValue}`);
  
  const maxValue2 = await mergeSortedArrays.getMaxValue([1, 3, 10], [2, 4, 6]);
  console.log(`  [1, 3, 10] 和 [2, 4, 6] 的最大值: ${maxValue2}`);
  console.log("");

  // 测试 8: getMinValue 函数
  console.log("=".repeat(60));
  console.log("📌 测试 8: getMinValue 获取最小值");
  console.log("=".repeat(60));
  
  const minValue = await mergeSortedArrays.getMinValue([3, 5, 7], [1, 4, 6]);
  console.log(`  [3, 5, 7] 和 [1, 4, 6] 的最小值: ${minValue}`);
  
  const minValue2 = await mergeSortedArrays.getMinValue([1, 3, 5], [2, 4, 6]);
  console.log(`  [1, 3, 5] 和 [2, 4, 6] 的最小值: ${minValue2}`);
  console.log("");

  // 测试 9: 复杂场景
  console.log("=".repeat(60));
  console.log("📌 测试 9: 复杂合并场景");
  console.log("=".repeat(60));
  
  const complex1 = await mergeSortedArrays.mergeSortedArrays([1, 1, 2, 3], [1, 2, 2, 4]);
  console.log(`  合并 [1, 1, 2, 3] 和 [1, 2, 2, 4]:`);
  console.log(`  结果: [${complex1.map(v => Number(v)).join(", ")}]`);
  
  const complex2 = await mergeSortedArrays.mergeMultipleArrays([[1, 3], [2, 4], [5, 6], [7, 8], [9]]);
  console.log(`  合并多个数组 [[1, 3], [2, 4], [5, 6], [7, 8], [9]]:`);
  console.log(`  结果: [${complex2.map(v => Number(v)).join(", ")}]`);
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

