const hre = require("hardhat");

/**
 * BinarySearch 合约交互式测试脚本
 * 用于在本地 Hardhat 网络上测试 BinarySearch 合约的所有功能
 */
async function main() {
  console.log("🚀 开始 BinarySearch 合约交互式测试...\n");

  // 定义 NOT_FOUND 常量
  const NOT_FOUND = BigInt(2**256) - 1n;

  // 获取测试账户
  const [owner] = await hre.ethers.getSigners();
  
  console.log("📋 测试账户信息:");
  console.log("  账户:", owner.address);
  console.log("");

  // 部署合约
  console.log("📦 正在部署 BinarySearch 合约...");
  const BinarySearch = await hre.ethers.getContractFactory("BinarySearch");
  const binarySearch = await BinarySearch.deploy();
  await binarySearch.waitForDeployment();
  const binarySearchAddress = await binarySearch.getAddress();
  console.log("✅ BinarySearch 合约部署成功!");
  console.log("📍 合约地址:", binarySearchAddress);
  console.log("");

  // 测试 1: binarySearch 基本功能
  console.log("=".repeat(60));
  console.log("📌 测试 1: binarySearch 基本功能");
  console.log("=".repeat(60));
  
  const nums1 = [1, 2, 3, 4, 5];
  const testCases = [
    { target: 1, expected: 0 },
    { target: 3, expected: 2 },
    { target: 5, expected: 4 },
    { target: 6, expected: NOT_FOUND },
    { target: 0, expected: NOT_FOUND },
  ];

  for (const testCase of testCases) {
    const result = await binarySearch.binarySearch(nums1, testCase.target);
    const status = result.toString() === testCase.expected.toString() ? "✅" : "❌";
    const displayResult = result === NOT_FOUND ? "NOT_FOUND" : result.toString();
    const displayExpected = testCase.expected === NOT_FOUND ? "NOT_FOUND" : testCase.expected.toString();
    console.log(`${status} 查找 ${testCase.target} -> 索引 ${displayResult} (期望: ${displayExpected})`);
  }
  console.log("");

  // 测试 2: search 函数
  console.log("=".repeat(60));
  console.log("📌 测试 2: search 函数（返回布尔值）");
  console.log("=".repeat(60));
  
  const searchTests = [
    { target: 3, expected: true },
    { target: 6, expected: false },
  ];

  for (const test of searchTests) {
    const result = await binarySearch.search(nums1, test.target);
    const status = result === test.expected ? "✅" : "❌";
    console.log(`${status} 查找 ${test.target}: ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 3: findFirst 函数
  console.log("=".repeat(60));
  console.log("📌 测试 3: findFirst 查找第一次出现");
  console.log("=".repeat(60));
  
  const nums2 = [1, 2, 2, 2, 3, 4, 5];
  const firstResult = await binarySearch.findFirst(nums2, 2);
  console.log(`✅ 在 [1, 2, 2, 2, 3, 4, 5] 中查找 2 的第一次出现: 索引 ${firstResult} (期望: 1)`);
  
  const firstNotFound = await binarySearch.findFirst(nums2, 6);
  console.log(`✅ 查找不存在的元素 6: ${firstNotFound === NOT_FOUND ? "NOT_FOUND" : firstNotFound} (期望: NOT_FOUND)`);
  console.log("");

  // 测试 4: findLast 函数
  console.log("=".repeat(60));
  console.log("📌 测试 4: findLast 查找最后一次出现");
  console.log("=".repeat(60));
  
  const lastResult = await binarySearch.findLast(nums2, 2);
  console.log(`✅ 在 [1, 2, 2, 2, 3, 4, 5] 中查找 2 的最后一次出现: 索引 ${lastResult} (期望: 3)`);
  
  const lastNotFound = await binarySearch.findLast(nums2, 6);
  console.log(`✅ 查找不存在的元素 6: ${lastNotFound === NOT_FOUND ? "NOT_FOUND" : lastNotFound} (期望: NOT_FOUND)`);
  console.log("");

  // 测试 5: searchInsert 函数
  console.log("=".repeat(60));
  console.log("📌 测试 5: searchInsert 查找插入位置");
  console.log("=".repeat(60));
  
  const nums3 = [1, 3, 5, 6];
  const insertTests = [
    { target: 5, expected: 2 },
    { target: 2, expected: 1 },
    { target: 0, expected: 0 },
    { target: 7, expected: 4 },
  ];

  for (const test of insertTests) {
    const result = await binarySearch.searchInsert(nums3, test.target);
    const status = result.toString() === test.expected.toString() ? "✅" : "❌";
    console.log(`${status} 插入 ${test.target} 的位置: ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 6: findLowerBound 函数
  console.log("=".repeat(60));
  console.log("📌 测试 6: findLowerBound 查找下界");
  console.log("=".repeat(60));
  
  const nums4 = [1, 2, 3, 4, 5];
  const lowerBound = await binarySearch.findLowerBound(nums4, 4);
  console.log(`✅ 在 [1, 2, 3, 4, 5] 中查找小于 4 的最大元素: 索引 ${lowerBound} (期望: 2, 即元素 3)`);
  
  const lowerNotFound = await binarySearch.findLowerBound(nums4, 1);
  console.log(`✅ 查找小于 1 的最大元素: ${lowerNotFound === NOT_FOUND ? "NOT_FOUND" : lowerNotFound} (期望: NOT_FOUND)`);
  console.log("");

  // 测试 7: findUpperBound 函数
  console.log("=".repeat(60));
  console.log("📌 测试 7: findUpperBound 查找上界");
  console.log("=".repeat(60));
  
  const upperBound = await binarySearch.findUpperBound(nums4, 2);
  console.log(`✅ 在 [1, 2, 3, 4, 5] 中查找大于 2 的最小元素: 索引 ${upperBound} (期望: 2, 即元素 3)`);
  
  const upperNotFound = await binarySearch.findUpperBound(nums4, 5);
  console.log(`✅ 查找大于 5 的最小元素: ${upperNotFound === NOT_FOUND ? "NOT_FOUND" : upperNotFound} (期望: NOT_FOUND)`);
  console.log("");

  // 测试 8: isSorted 函数
  console.log("=".repeat(60));
  console.log("📌 测试 8: isSorted 排序验证");
  console.log("=".repeat(60));
  
  const sortedArray = [1, 2, 3, 4, 5];
  const unsortedArray = [1, 3, 2, 4, 5];
  
  const isSorted1 = await binarySearch.isSorted(sortedArray);
  const isSorted2 = await binarySearch.isSorted(unsortedArray);
  
  console.log(`[1, 2, 3, 4, 5] 是否已排序: ${isSorted1 ? "✅ 是" : "❌ 否"}`);
  console.log(`[1, 3, 2, 4, 5] 是否已排序: ${isSorted2 ? "✅ 是" : "❌ 否"}`);
  console.log("");

  // 测试 9: 边界情况
  console.log("=".repeat(60));
  console.log("📌 测试 9: 边界情况");
  console.log("=".repeat(60));
  
  const emptyResult = await binarySearch.binarySearch([], 1);
  console.log(`空数组查找: ${emptyResult === NOT_FOUND ? "NOT_FOUND" : emptyResult} (期望: NOT_FOUND)`);
  
  const singleFound = await binarySearch.binarySearch([5], 5);
  const singleNotFound = await binarySearch.binarySearch([5], 3);
  console.log(`单元素数组 [5] 查找 5: 索引 ${singleFound} (期望: 0)`);
  console.log(`单元素数组 [5] 查找 3: ${singleNotFound === NOT_FOUND ? "NOT_FOUND" : singleNotFound} (期望: NOT_FOUND)`);
  
  // 大数组测试
  const largeArray = Array.from({ length: 100 }, (_, i) => i + 1);
  const largeResult = await binarySearch.binarySearch(largeArray, 50);
  console.log(`大数组 (100元素) 查找 50: 索引 ${largeResult} (期望: 49)`);
  console.log("");

  // 测试 10: 一致性测试
  console.log("=".repeat(60));
  console.log("📌 测试 10: 一致性测试");
  console.log("=".repeat(60));
  
  const consistencyNums = [1, 2, 3, 4, 5];
  const consistencyTarget = 3;
  
  const index = await binarySearch.binarySearch(consistencyNums, consistencyTarget);
  const exists = await binarySearch.search(consistencyNums, consistencyTarget);
  
  console.log(`binarySearch 返回索引: ${index}`);
  console.log(`search 返回存在: ${exists}`);
  console.log(`一致性检查: ${exists === (index !== NOT_FOUND) ? "✅ 一致" : "❌ 不一致"}`);
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

