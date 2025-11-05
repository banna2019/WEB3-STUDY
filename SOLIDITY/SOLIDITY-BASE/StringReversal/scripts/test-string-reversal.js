const hre = require("hardhat");

/**
 * StringReversal 合约交互式测试脚本
 * 用于在本地 Hardhat 网络上测试 StringReversal 合约的所有功能
 */
async function main() {
  console.log("🚀 开始 StringReversal 合约交互式测试...\n");

  // 获取测试账户
  const [owner] = await hre.ethers.getSigners();
  
  console.log("📋 测试账户信息:");
  console.log("  账户:", owner.address);
  console.log("");

  // 部署合约
  console.log("📦 正在部署 StringReversal 合约...");
  const StringReversal = await hre.ethers.getContractFactory("StringReversal");
  const stringReversal = await StringReversal.deploy();
  await stringReversal.waitForDeployment();
  const stringReversalAddress = await stringReversal.getAddress();
  console.log("✅ StringReversal 合约部署成功!");
  console.log("📍 合约地址:", stringReversalAddress);
  console.log("");

  // 测试 1: 基本反转功能
  console.log("=".repeat(60));
  console.log("📌 测试 1: 基本反转功能");
  console.log("=".repeat(60));
  
  const testCases = [
    { input: "abcde", expected: "edcba" },
    { input: "hello", expected: "olleh" },
    { input: "12345", expected: "54321" },
    { input: "a", expected: "a" },
    { input: "", expected: "" },
  ];

  for (const testCase of testCases) {
    const result = await stringReversal.reverse(testCase.input);
    const status = result === testCase.expected ? "✅" : "❌";
    console.log(`${status} 输入: "${testCase.input}" -> 输出: "${result}" (期望: "${testCase.expected}")`);
  }
  console.log("");

  // 测试 2: reverseBytes 函数
  console.log("=".repeat(60));
  console.log("📌 测试 2: reverseBytes 函数");
  console.log("=".repeat(60));
  
  const testString = "Hello, World!";
  const inputBytes = hre.ethers.toUtf8Bytes(testString);
  const result1 = await stringReversal.reverse(testString);
  const result2 = await stringReversal.reverseBytes(inputBytes);
  
  console.log(`输入字符串: "${testString}"`);
  console.log(`reverse() 结果: "${result1}"`);
  console.log(`reverseBytes() 结果: "${result2}"`);
  console.log(`结果一致: ${result1 === result2 ? "✅" : "❌"}`);
  console.log("");

  // 测试 3: verifyReversal 函数
  console.log("=".repeat(60));
  console.log("📌 测试 3: verifyReversal 验证功能");
  console.log("=".repeat(60));
  
  const verifyTests = [
    { original: "abcde", expected: "edcba", shouldPass: true },
    { original: "hello", expected: "olleh", shouldPass: true },
    { original: "abcde", expected: "abcde", shouldPass: false },
    { original: "", expected: "", shouldPass: true },
  ];

  for (const test of verifyTests) {
    const result = await stringReversal.verifyReversal(test.original, test.expected);
    const status = result === test.shouldPass ? "✅" : "❌";
    console.log(`${status} 原始: "${test.original}", 期望: "${test.expected}", 验证: ${result}`);
  }
  console.log("");

  // 测试 4: getStringLength 函数
  console.log("=".repeat(60));
  console.log("📌 测试 4: getStringLength 函数");
  console.log("=".repeat(60));
  
  const lengthTests = ["abcde", "hello world", "", "a", "1234567890"];
  
  for (const testStr of lengthTests) {
    const length = await stringReversal.getStringLength(testStr);
    const expectedLength = testStr.length;
    const status = length.toString() === expectedLength.toString() ? "✅" : "❌";
    console.log(`${status} 字符串: "${testStr}" -> 长度: ${length} (期望: ${expectedLength})`);
  }
  console.log("");

  // 测试 5: 特殊字符处理
  console.log("=".repeat(60));
  console.log("📌 测试 5: 特殊字符处理");
  console.log("=".repeat(60));
  
  const specialCases = [
    "!@#$%",
    "hello world",
    "a\nb",
    "a\tb",
  ];

  for (const specialStr of specialCases) {
    const result = await stringReversal.reverse(specialStr);
    const expected = specialStr.split("").reverse().join("");
    const status = result === expected ? "✅" : "❌";
    console.log(`${status} 输入: "${specialStr}" -> 输出: "${result}"`);
  }
  console.log("");

  // 测试 6: 双重反转测试
  console.log("=".repeat(60));
  console.log("📌 测试 6: 双重反转测试（应该返回原始字符串）");
  console.log("=".repeat(60));
  
  const doubleReverseTests = ["abcde", "hello", "12345", "!@#$%"];
  
  for (const testStr of doubleReverseTests) {
    const firstReverse = await stringReversal.reverse(testStr);
    const secondReverse = await stringReversal.reverse(firstReverse);
    const status = secondReverse === testStr ? "✅" : "❌";
    console.log(`${status} 原始: "${testStr}" -> 第一次反转: "${firstReverse}" -> 第二次反转: "${secondReverse}"`);
  }
  console.log("");

  // 测试 7: 长字符串测试
  console.log("=".repeat(60));
  console.log("📌 测试 7: 长字符串测试");
  console.log("=".repeat(60));
  
  const longString = "a".repeat(100);
  const longResult = await stringReversal.reverse(longString);
  const longExpected = longString.split("").reverse().join("");
  const status = longResult === longExpected ? "✅" : "❌";
  console.log(`${status} 长字符串 (100 字符) 反转成功`);
  console.log(`   长度检查: ${longResult.length === 100 ? "✅" : "❌"}`);
  console.log("");

  // 测试 8: 回文字符串测试
  console.log("=".repeat(60));
  console.log("📌 测试 8: 回文字符串测试");
  console.log("=".repeat(60));
  
  const palindromes = ["aba", "a", "racecar", "level"];
  
  for (const palindrome of palindromes) {
    const result = await stringReversal.reverse(palindrome);
    const status = result === palindrome ? "✅" : "❌";
    console.log(`${status} 回文字符串: "${palindrome}" -> 反转后: "${result}"`);
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

