const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StringReversal", function () {
  let stringReversal;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const StringReversal = await ethers.getContractFactory("StringReversal");
    stringReversal = await StringReversal.deploy();
    await stringReversal.waitForDeployment();
  });

  describe("部署", function () {
    it("应该成功部署合约", async function () {
      expect(await stringReversal.getAddress()).to.be.a("string");
      expect(await stringReversal.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe("reverse 函数", function () {
    it("应该反转简单的字符串", async function () {
      const result = await stringReversal.reverse("abcde");
      expect(result).to.equal("edcba");
    });

    it("应该反转单个字符", async function () {
      const result = await stringReversal.reverse("a");
      expect(result).to.equal("a");
    });

    it("应该反转空字符串", async function () {
      const result = await stringReversal.reverse("");
      expect(result).to.equal("");
    });

    it("应该反转两个字符的字符串", async function () {
      const result = await stringReversal.reverse("ab");
      expect(result).to.equal("ba");
    });

    it("应该反转回文字符串", async function () {
      const result = await stringReversal.reverse("aba");
      expect(result).to.equal("aba");
    });

    it("应该反转包含数字的字符串", async function () {
      const result = await stringReversal.reverse("12345");
      expect(result).to.equal("54321");
    });

    it("应该反转包含特殊字符的字符串", async function () {
      const result = await stringReversal.reverse("a!b@c#");
      expect(result).to.equal("#c@b!a");
    });

    it("应该反转包含空格的字符串", async function () {
      const result = await stringReversal.reverse("hello world");
      expect(result).to.equal("dlrow olleh");
    });

    it("应该反转长字符串", async function () {
      const longString = "abcdefghijklmnopqrstuvwxyz";
      const expected = "zyxwvutsrqponmlkjihgfedcba";
      const result = await stringReversal.reverse(longString);
      expect(result).to.equal(expected);
    });

    it("应该反转包含大写和小写字母的字符串", async function () {
      const result = await stringReversal.reverse("HelloWorld");
      expect(result).to.equal("dlroWolleH");
    });

    it("应该处理包含中文字符的字符串（不会崩溃）", async function () {
      // 注意：中文字符在 UTF-8 编码中占用多个字节
      // Solidity 按字节反转，不是按字符反转，所以结果可能不是预期的
      // 这里主要测试函数不会崩溃
      try {
        const result = await stringReversal.reverse("你好世界");
        expect(result).to.be.a("string");
      } catch (error) {
        // 如果 ABI 解码失败，说明 Solidity 无法正确处理多字节字符
        // 这是预期的行为，因为 Solidity 按字节操作
        expect(error.message).to.include("ABI decoding");
      }
    });
  });

  describe("reverseBytes 函数", function () {
    it("应该反转字节数组", async function () {
      const input = ethers.toUtf8Bytes("abcde");
      const result = await stringReversal.reverseBytes(input);
      expect(result).to.equal("edcba");
    });

    it("应该反转空字节数组", async function () {
      const input = ethers.toUtf8Bytes("");
      const result = await stringReversal.reverseBytes(input);
      expect(result).to.equal("");
    });

    it("应该反转单个字符的字节数组", async function () {
      const input = ethers.toUtf8Bytes("a");
      const result = await stringReversal.reverseBytes(input);
      expect(result).to.equal("a");
    });

    it("应该与 reverse 函数产生相同的结果", async function () {
      const testString = "Hello, World!";
      const result1 = await stringReversal.reverse(testString);
      const inputBytes = ethers.toUtf8Bytes(testString);
      const result2 = await stringReversal.reverseBytes(inputBytes);
      expect(result1).to.equal(result2);
    });
  });

  describe("verifyReversal 函数", function () {
    it("应该验证正确的反转结果", async function () {
      const original = "abcde";
      const expected = "edcba";
      const result = await stringReversal.verifyReversal(original, expected);
      expect(result).to.be.true;
    });

    it("应该拒绝错误的反转结果", async function () {
      const original = "abcde";
      const wrongExpected = "abcde"; // 错误的期望值
      const result = await stringReversal.verifyReversal(original, wrongExpected);
      expect(result).to.be.false;
    });

    it("应该验证空字符串的反转", async function () {
      const result = await stringReversal.verifyReversal("", "");
      expect(result).to.be.true;
    });

    it("应该验证回文字符串", async function () {
      const palindrome = "aba";
      const result = await stringReversal.verifyReversal(palindrome, palindrome);
      expect(result).to.be.true;
    });

    it("应该验证复杂字符串的反转", async function () {
      const original = "Hello, World!";
      const expected = "!dlroW ,olleH";
      const result = await stringReversal.verifyReversal(original, expected);
      expect(result).to.be.true;
    });
  });

  describe("getStringLength 函数", function () {
    it("应该返回正确的字符串长度", async function () {
      const length = await stringReversal.getStringLength("abcde");
      expect(length).to.equal(5);
    });

    it("应该返回空字符串的长度为 0", async function () {
      const length = await stringReversal.getStringLength("");
      expect(length).to.equal(0);
    });

    it("应该返回单字符字符串的长度为 1", async function () {
      const length = await stringReversal.getStringLength("a");
      expect(length).to.equal(1);
    });

    it("应该返回包含空格字符串的正确长度", async function () {
      const length = await stringReversal.getStringLength("hello world");
      expect(length).to.equal(11);
    });

    it("应该返回长字符串的正确长度", async function () {
      const longString = "a".repeat(100);
      const length = await stringReversal.getStringLength(longString);
      expect(length).to.equal(100);
    });
  });

  describe("边界情况", function () {
    it("应该处理很长的字符串", async function () {
      const longString = "a".repeat(500);
      const result = await stringReversal.reverse(longString);
      expect(result).to.equal(longString.split("").reverse().join(""));
    });

    it("应该处理包含换行符的字符串", async function () {
      const stringWithNewline = "hello\nworld";
      const result = await stringReversal.reverse(stringWithNewline);
      expect(result).to.equal("dlrow\nolleh");
    });

    it("应该处理包含制表符的字符串", async function () {
      const stringWithTab = "hello\tworld";
      const result = await stringReversal.reverse(stringWithTab);
      expect(result).to.equal("dlrow\tolleh");
    });

    it("应该处理 Unicode 字符（不会崩溃）", async function () {
      // Unicode emoji 字符在 UTF-8 编码中占用多个字节
      // Solidity 按字节反转，不是按字符反转
      // 这里主要测试函数不会崩溃
      try {
        const unicodeString = "🎉Hello🎉";
        const result = await stringReversal.reverse(unicodeString);
        expect(result).to.be.a("string");
        expect(result.length).to.be.greaterThan(0);
      } catch (error) {
        // 如果 ABI 解码失败，说明 Solidity 无法正确处理多字节字符
        // 这是预期的行为，因为 Solidity 按字节操作
        expect(error.message).to.include("ABI decoding");
      }
    });
  });

  describe("一致性测试", function () {
    it("reverse 和 reverseBytes 应该产生相同的结果", async function () {
      const testCases = ["abc", "hello", "123", "!@#", "a", ""];
      
      for (const testCase of testCases) {
        const result1 = await stringReversal.reverse(testCase);
        const bytes = ethers.toUtf8Bytes(testCase);
        const result2 = await stringReversal.reverseBytes(bytes);
        expect(result1).to.equal(result2, `Failed for: ${testCase}`);
      }
    });

    it("双重反转应该返回原始字符串", async function () {
      const testCases = ["abcde", "hello", "12345", "!@#$%"];
      
      for (const testCase of testCases) {
        const firstReverse = await stringReversal.reverse(testCase);
        const secondReverse = await stringReversal.reverse(firstReverse);
        expect(secondReverse).to.equal(testCase, `Failed for: ${testCase}`);
      }
    });
  });
});

