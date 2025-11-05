const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RomanToInteger", function () {
  let romanToInteger;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const RomanToInteger = await ethers.getContractFactory("RomanToInteger");
    romanToInteger = await RomanToInteger.deploy();
    await romanToInteger.waitForDeployment();
  });

  describe("部署", function () {
    it("应该成功部署合约", async function () {
      expect(await romanToInteger.getAddress()).to.be.a("string");
      expect(await romanToInteger.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe("基本转换", function () {
    it("应该转换单个字符 I", async function () {
      expect(await romanToInteger.romanToInt("I")).to.equal(1);
    });

    it("应该转换单个字符 V", async function () {
      expect(await romanToInteger.romanToInt("V")).to.equal(5);
    });

    it("应该转换单个字符 X", async function () {
      expect(await romanToInteger.romanToInt("X")).to.equal(10);
    });

    it("应该转换单个字符 L", async function () {
      expect(await romanToInteger.romanToInt("L")).to.equal(50);
    });

    it("应该转换单个字符 C", async function () {
      expect(await romanToInteger.romanToInt("C")).to.equal(100);
    });

    it("应该转换单个字符 D", async function () {
      expect(await romanToInteger.romanToInt("D")).to.equal(500);
    });

    it("应该转换单个字符 M", async function () {
      expect(await romanToInteger.romanToInt("M")).to.equal(1000);
    });
  });

  describe("加法规则", function () {
    it("应该转换 II (1+1=2)", async function () {
      expect(await romanToInteger.romanToInt("II")).to.equal(2);
    });

    it("应该转换 III (1+1+1=3)", async function () {
      expect(await romanToInteger.romanToInt("III")).to.equal(3);
    });

    it("应该转换 XII (10+1+1=12)", async function () {
      expect(await romanToInteger.romanToInt("XII")).to.equal(12);
    });

    it("应该转换 XXVII (10+10+5+1+1=27)", async function () {
      expect(await romanToInteger.romanToInt("XXVII")).to.equal(27);
    });

    it("应该转换 LVIII (50+5+1+1+1=58)", async function () {
      expect(await romanToInteger.romanToInt("LVIII")).to.equal(58);
    });
  });

  describe("减法规则", function () {
    it("应该转换 IV (5-1=4)", async function () {
      expect(await romanToInteger.romanToInt("IV")).to.equal(4);
    });

    it("应该转换 IX (10-1=9)", async function () {
      expect(await romanToInteger.romanToInt("IX")).to.equal(9);
    });

    it("应该转换 XL (50-10=40)", async function () {
      expect(await romanToInteger.romanToInt("XL")).to.equal(40);
    });

    it("应该转换 XC (100-10=90)", async function () {
      expect(await romanToInteger.romanToInt("XC")).to.equal(90);
    });

    it("应该转换 CD (500-100=400)", async function () {
      expect(await romanToInteger.romanToInt("CD")).to.equal(400);
    });

    it("应该转换 CM (1000-100=900)", async function () {
      expect(await romanToInteger.romanToInt("CM")).to.equal(900);
    });
  });

  describe("复合规则", function () {
    it("应该转换 XIV (10+5-1=14)", async function () {
      expect(await romanToInteger.romanToInt("XIV")).to.equal(14);
    });

    it("应该转换 MCMXCIV (1000+900+90+4=1994)", async function () {
      expect(await romanToInteger.romanToInt("MCMXCIV")).to.equal(1994);
    });

    it("应该转换 MCDXLIV (1000+400+40+4=1444)", async function () {
      expect(await romanToInteger.romanToInt("MCDXLIV")).to.equal(1444);
    });

    it("应该转换 MMCDXLIV (2000+400+40+4=2444)", async function () {
      expect(await romanToInteger.romanToInt("MMCDXLIV")).to.equal(2444);
    });

    it("应该转换 MMMCMXCIX (3999)", async function () {
      expect(await romanToInteger.romanToInt("MMMCMXCIX")).to.equal(3999);
    });
  });

  describe("边界情况", function () {
    it("应该处理空字符串", async function () {
      expect(await romanToInteger.romanToInt("")).to.equal(0);
    });

    it("应该处理单个字符", async function () {
      expect(await romanToInteger.romanToInt("I")).to.equal(1);
      expect(await romanToInteger.romanToInt("M")).to.equal(1000);
    });

    it("应该处理最大数字 MMMCMXCIX (3999)", async function () {
      expect(await romanToInteger.romanToInt("MMMCMXCIX")).to.equal(3999);
    });
  });

  describe("isValidRoman 函数", function () {
    it("应该验证有效的罗马数字", async function () {
      expect(await romanToInteger.isValidRoman("I")).to.be.true;
      expect(await romanToInteger.isValidRoman("IV")).to.be.true;
      expect(await romanToInteger.isValidRoman("MCMXCIV")).to.be.true;
      expect(await romanToInteger.isValidRoman("MMMCMXCIX")).to.be.true;
    });

    it("应该拒绝无效的字符", async function () {
      expect(await romanToInteger.isValidRoman("A")).to.be.false;
      expect(await romanToInteger.isValidRoman("B")).to.be.false;
      expect(await romanToInteger.isValidRoman("Z")).to.be.false;
      expect(await romanToInteger.isValidRoman("1")).to.be.false;
      expect(await romanToInteger.isValidRoman("!")).to.be.false;
    });

    it("应该验证空字符串", async function () {
      expect(await romanToInteger.isValidRoman("")).to.be.true;
    });

    it("应该验证包含无效字符的字符串", async function () {
      expect(await romanToInteger.isValidRoman("IVX")).to.be.true; // 所有字符都是有效的
      expect(await romanToInteger.isValidRoman("IVXA")).to.be.false; // 包含无效字符 A
    });
  });

  describe("batchConvert 函数", function () {
    it("应该批量转换多个罗马数字", async function () {
      const romans = ["I", "IV", "IX", "X", "XL", "XC", "C", "CD", "CM", "M"];
      const results = await romanToInteger.batchConvert(romans);
      
      expect(results.length).to.equal(romans.length);
      expect(results[0]).to.equal(1);   // I
      expect(results[1]).to.equal(4);   // IV
      expect(results[2]).to.equal(9);   // IX
      expect(results[3]).to.equal(10);  // X
      expect(results[4]).to.equal(40);  // XL
      expect(results[5]).to.equal(90);  // XC
      expect(results[6]).to.equal(100); // C
      expect(results[7]).to.equal(400); // CD
      expect(results[8]).to.equal(900); // CM
      expect(results[9]).to.equal(1000); // M
    });

    it("应该处理空数组", async function () {
      const results = await romanToInteger.batchConvert([]);
      expect(results.length).to.equal(0);
    });

    it("应该处理单个元素", async function () {
      const results = await romanToInteger.batchConvert(["MCMXCIV"]);
      expect(results.length).to.equal(1);
      expect(results[0]).to.equal(1994);
    });

    it("应该处理大量元素", async function () {
      const romans = Array(10).fill("MCMXCIV");
      const results = await romanToInteger.batchConvert(romans);
      expect(results.length).to.equal(10);
      results.forEach(result => {
        expect(result).to.equal(1994);
      });
    });
  });

  describe("错误处理", function () {
    it("应该拒绝无效的罗马数字字符", async function () {
      await expect(romanToInteger.romanToInt("A")).to.be.revertedWith("Invalid Roman numeral character");
    });

    it("应该拒绝包含数字的字符串", async function () {
      await expect(romanToInteger.romanToInt("IV1")).to.be.revertedWith("Invalid Roman numeral character");
    });

    it("应该拒绝包含特殊字符的字符串", async function () {
      await expect(romanToInteger.romanToInt("IV!")).to.be.revertedWith("Invalid Roman numeral character");
    });

    it("应该拒绝小写字母", async function () {
      await expect(romanToInteger.romanToInt("iv")).to.be.revertedWith("Invalid Roman numeral character");
    });
  });

  describe("复杂场景", function () {
    it("应该处理连续减法规则", async function () {
      // MCMXCIV = 1000 + 900 + 90 + 4 = 1994
      expect(await romanToInteger.romanToInt("MCMXCIV")).to.equal(1994);
    });

    it("应该处理混合加法和减法", async function () {
      // MCDXLIV = 1000 + 400 + 40 + 4 = 1444
      expect(await romanToInteger.romanToInt("MCDXLIV")).to.equal(1444);
    });

    it("应该处理大数字", async function () {
      // MMMCMXCIX = 3000 + 900 + 90 + 9 = 3999
      expect(await romanToInteger.romanToInt("MMMCMXCIX")).to.equal(3999);
    });

    it("应该处理多个连续的大字符", async function () {
      // MMM = 3000
      expect(await romanToInteger.romanToInt("MMM")).to.equal(3000);
    });
  });

  describe("一致性测试", function () {
    it("应该与预期值一致", async function () {
      const testCases = [
        { roman: "I", expected: 1 },
        { roman: "IV", expected: 4 },
        { roman: "IX", expected: 9 },
        { roman: "XL", expected: 40 },
        { roman: "XC", expected: 90 },
        { roman: "CD", expected: 400 },
        { roman: "CM", expected: 900 },
        { roman: "MCMXCIV", expected: 1994 },
        { roman: "MMMCMXCIX", expected: 3999 },
      ];

      for (const testCase of testCases) {
        const result = await romanToInteger.romanToInt(testCase.roman);
        expect(result).to.equal(testCase.expected, `Failed for: ${testCase.roman}`);
      }
    });
  });
});

