const hre = require("hardhat");

/**
 * RomanToInteger 合约交互式测试脚本
 * 用于在本地 Hardhat 网络上测试 RomanToInteger 合约的所有功能
 */
async function main() {
  console.log("🚀 开始 RomanToInteger 合约交互式测试...\n");

  // 获取测试账户
  const [owner] = await hre.ethers.getSigners();
  
  console.log("📋 测试账户信息:");
  console.log("  账户:", owner.address);
  console.log("");

  // 部署合约
  console.log("📦 正在部署 RomanToInteger 合约...");
  const RomanToInteger = await hre.ethers.getContractFactory("RomanToInteger");
  const romanToInteger = await RomanToInteger.deploy();
  await romanToInteger.waitForDeployment();
  const romanToIntegerAddress = await romanToInteger.getAddress();
  console.log("✅ RomanToInteger 合约部署成功!");
  console.log("📍 合约地址:", romanToIntegerAddress);
  console.log("");

  // 测试 1: 基本字符转换
  console.log("=".repeat(60));
  console.log("📌 测试 1: 基本字符转换");
  console.log("=".repeat(60));
  
  const basicChars = ["I", "V", "X", "L", "C", "D", "M"];
  const expectedValues = [1, 5, 10, 50, 100, 500, 1000];
  
  for (let i = 0; i < basicChars.length; i++) {
    const result = await romanToInteger.romanToInt(basicChars[i]);
    const status = result.toString() === expectedValues[i].toString() ? "✅" : "❌";
    console.log(`${status} ${basicChars[i]} -> ${result} (期望: ${expectedValues[i]})`);
  }
  console.log("");

  // 测试 2: 加法规则
  console.log("=".repeat(60));
  console.log("📌 测试 2: 加法规则");
  console.log("=".repeat(60));
  
  const additionTests = [
    { roman: "II", expected: 2 },
    { roman: "III", expected: 3 },
    { roman: "XII", expected: 12 },
    { roman: "XXVII", expected: 27 },
    { roman: "LVIII", expected: 58 },
  ];

  for (const test of additionTests) {
    const result = await romanToInteger.romanToInt(test.roman);
    const status = result.toString() === test.expected.toString() ? "✅" : "❌";
    console.log(`${status} ${test.roman} -> ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 3: 减法规则
  console.log("=".repeat(60));
  console.log("📌 测试 3: 减法规则");
  console.log("=".repeat(60));
  
  const subtractionTests = [
    { roman: "IV", expected: 4 },
    { roman: "IX", expected: 9 },
    { roman: "XL", expected: 40 },
    { roman: "XC", expected: 90 },
    { roman: "CD", expected: 400 },
    { roman: "CM", expected: 900 },
  ];

  for (const test of subtractionTests) {
    const result = await romanToInteger.romanToInt(test.roman);
    const status = result.toString() === test.expected.toString() ? "✅" : "❌";
    console.log(`${status} ${test.roman} -> ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 4: 复合规则
  console.log("=".repeat(60));
  console.log("📌 测试 4: 复合规则（加法+减法）");
  console.log("=".repeat(60));
  
  const complexTests = [
    { roman: "XIV", expected: 14 },
    { roman: "MCMXCIV", expected: 1994 },
    { roman: "MCDXLIV", expected: 1444 },
    { roman: "MMCDXLIV", expected: 2444 },
    { roman: "MMMCMXCIX", expected: 3999 },
  ];

  for (const test of complexTests) {
    const result = await romanToInteger.romanToInt(test.roman);
    const status = result.toString() === test.expected.toString() ? "✅" : "❌";
    console.log(`${status} ${test.roman} -> ${result} (期望: ${test.expected})`);
  }
  console.log("");

  // 测试 5: 验证函数
  console.log("=".repeat(60));
  console.log("📌 测试 5: isValidRoman 验证函数");
  console.log("=".repeat(60));
  
  const validRomans = ["I", "IV", "IX", "MCMXCIV", "MMMCMXCIX"];
  const invalidRomans = ["A", "B", "1", "!", "iv"]; // 小写也是无效的
  
  console.log("有效罗马数字:");
  for (const roman of validRomans) {
    const isValid = await romanToInteger.isValidRoman(roman);
    const status = isValid ? "✅" : "❌";
    console.log(`  ${status} ${roman}: ${isValid}`);
  }
  
  console.log("\n无效罗马数字:");
  for (const roman of invalidRomans) {
    const isValid = await romanToInteger.isValidRoman(roman);
    const status = !isValid ? "✅" : "❌";
    console.log(`  ${status} ${roman}: ${isValid} (期望: false)`);
  }
  console.log("");

  // 测试 6: 批量转换
  console.log("=".repeat(60));
  console.log("📌 测试 6: batchConvert 批量转换");
  console.log("=".repeat(60));
  
  const batchRomans = ["I", "IV", "IX", "X", "XL", "XC", "C", "CD", "CM", "M"];
  const batchResults = await romanToInteger.batchConvert(batchRomans);
  
  console.log("批量转换结果:");
  for (let i = 0; i < batchRomans.length; i++) {
    console.log(`  ${batchRomans[i]} -> ${batchResults[i]}`);
  }
  console.log("");

  // 测试 7: 边界情况
  console.log("=".repeat(60));
  console.log("📌 测试 7: 边界情况");
  console.log("=".repeat(60));
  
  const emptyResult = await romanToInteger.romanToInt("");
  console.log(`空字符串: ${emptyResult} (期望: 0)`);
  
  const maxResult = await romanToInteger.romanToInt("MMMCMXCIX");
  console.log(`最大数字 MMMCMXCIX: ${maxResult} (期望: 3999)`);
  console.log("");

  // 测试 8: 错误处理
  console.log("=".repeat(60));
  console.log("📌 测试 8: 错误处理");
  console.log("=".repeat(60));
  
  const invalidInputs = ["A", "IV1", "IV!", "iv"];
  
  for (const invalid of invalidInputs) {
    try {
      await romanToInteger.romanToInt(invalid);
      console.log(`❌ ${invalid}: 应该失败但没有失败`);
    } catch (error) {
      console.log(`✅ ${invalid}: 正确拒绝 (${error.message.split(":")[0]})`);
    }
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

