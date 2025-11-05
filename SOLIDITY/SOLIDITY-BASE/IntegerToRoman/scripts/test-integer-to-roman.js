const hre = require("hardhat");

/**
 * IntegerToRoman 合约交互式测试脚本
 * 用于在本地 Hardhat 网络上测试 IntegerToRoman 合约的所有功能
 */
async function main() {
  console.log("🚀 开始 IntegerToRoman 合约交互式测试...\n");

  // 获取测试账户
  const [owner] = await hre.ethers.getSigners();
  
  console.log("📋 测试账户信息:");
  console.log("  账户:", owner.address);
  console.log("");

  // 部署合约
  console.log("📦 正在部署 IntegerToRoman 合约...");
  const IntegerToRoman = await hre.ethers.getContractFactory("IntegerToRoman");
  const integerToRoman = await IntegerToRoman.deploy();
  await integerToRoman.waitForDeployment();
  const integerToRomanAddress = await integerToRoman.getAddress();
  console.log("✅ IntegerToRoman 合约部署成功!");
  console.log("📍 合约地址:", integerToRomanAddress);
  console.log("");

  // 测试 1: 基本字符转换
  console.log("=".repeat(60));
  console.log("📌 测试 1: 基本字符转换");
  console.log("=".repeat(60));
  
  const basicTests = [
    { num: 1, expected: "I" },
    { num: 5, expected: "V" },
    { num: 10, expected: "X" },
    { num: 50, expected: "L" },
    { num: 100, expected: "C" },
    { num: 500, expected: "D" },
    { num: 1000, expected: "M" },
  ];

  for (const test of basicTests) {
    const result = await integerToRoman.intToRoman(test.num);
    const status = result === test.expected ? "✅" : "❌";
    console.log(`${status} ${test.num} -> ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 2: 加法规则
  console.log("=".repeat(60));
  console.log("📌 测试 2: 加法规则");
  console.log("=".repeat(60));
  
  const additionTests = [
    { num: 2, expected: "II" },
    { num: 3, expected: "III" },
    { num: 6, expected: "VI" },
    { num: 7, expected: "VII" },
    { num: 8, expected: "VIII" },
    { num: 12, expected: "XII" },
    { num: 27, expected: "XXVII" },
    { num: 58, expected: "LVIII" },
  ];

  for (const test of additionTests) {
    const result = await integerToRoman.intToRoman(test.num);
    const status = result === test.expected ? "✅" : "❌";
    console.log(`${status} ${test.num} -> ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 3: 减法规则
  console.log("=".repeat(60));
  console.log("📌 测试 3: 减法规则");
  console.log("=".repeat(60));
  
  const subtractionTests = [
    { num: 4, expected: "IV" },
    { num: 9, expected: "IX" },
    { num: 40, expected: "XL" },
    { num: 90, expected: "XC" },
    { num: 400, expected: "CD" },
    { num: 900, expected: "CM" },
  ];

  for (const test of subtractionTests) {
    const result = await integerToRoman.intToRoman(test.num);
    const status = result === test.expected ? "✅" : "❌";
    console.log(`${status} ${test.num} -> ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 4: 复合规则
  console.log("=".repeat(60));
  console.log("📌 测试 4: 复合规则（加法+减法）");
  console.log("=".repeat(60));
  
  const complexTests = [
    { num: 14, expected: "XIV" },
    { num: 1994, expected: "MCMXCIV" },
    { num: 1444, expected: "MCDXLIV" },
    { num: 2444, expected: "MMCDXLIV" },
    { num: 3999, expected: "MMMCMXCIX" },
  ];

  for (const test of complexTests) {
    const result = await integerToRoman.intToRoman(test.num);
    const status = result === test.expected ? "✅" : "❌";
    console.log(`${status} ${test.num} -> ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 5: 边界情况
  console.log("=".repeat(60));
  console.log("📌 测试 5: 边界情况");
  console.log("=".repeat(60));
  
  const minValue = await integerToRoman.getMinValue();
  const maxValue = await integerToRoman.getMaxValue();
  console.log(`✅ 最小值: ${minValue}`);
  console.log(`✅ 最大值: ${maxValue}`);
  
  const minResult = await integerToRoman.intToRoman(minValue);
  const maxResult = await integerToRoman.intToRoman(maxValue);
  console.log(`✅ ${minValue} -> ${minResult}`);
  console.log(`✅ ${maxValue} -> ${maxResult}`);
  
  console.log("\n🔴 测试错误处理:");
  try {
    await integerToRoman.intToRoman(0);
    console.log("❌ 0: 应该失败但没有失败");
  } catch (error) {
    console.log("✅ 0: 正确拒绝");
  }
  
  try {
    await integerToRoman.intToRoman(4000);
    console.log("❌ 4000: 应该失败但没有失败");
  } catch (error) {
    console.log("✅ 4000: 正确拒绝");
  }
  console.log("");

  // 测试 6: 批量转换
  console.log("=".repeat(60));
  console.log("📌 测试 6: batchConvert 批量转换");
  console.log("=".repeat(60));
  
  const batchNums = [1, 4, 9, 10, 40, 90, 100, 400, 900, 1000];
  const batchResults = await integerToRoman.batchConvert(batchNums);
  
  console.log("批量转换结果:");
  for (let i = 0; i < batchNums.length; i++) {
    console.log(`  ${batchNums[i]} -> ${batchResults[i]}`);
  }
  console.log("");

  // 测试 7: 特殊场景
  console.log("=".repeat(60));
  console.log("📌 测试 7: 特殊场景");
  console.log("=".repeat(60));
  
  const specialTests = [
    { desc: "只包含千位", num: 2000, expected: "MM" },
    { desc: "只包含百位", num: 300, expected: "CCC" },
    { desc: "只包含十位", num: 30, expected: "XXX" },
    { desc: "只包含个位", num: 3, expected: "III" },
    { desc: "包含所有位数", num: 1994, expected: "MCMXCIV" },
  ];

  for (const test of specialTests) {
    const result = await integerToRoman.intToRoman(test.num);
    const status = result === test.expected ? "✅" : "❌";
    console.log(`${status} ${test.desc} (${test.num}): ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 8: 验证函数
  console.log("=".repeat(60));
  console.log("📌 测试 8: verifyConversion 验证函数");
  console.log("=".repeat(60));
  
  const testNum = 1994;
  const testRoman = await integerToRoman.intToRoman(testNum);
  const isValid = await integerToRoman.verifyConversion(testRoman, testNum);
  console.log(`验证 ${testNum} -> ${testRoman}: ${isValid ? "✅ 有效" : "❌ 无效"}`);
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

