const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IntegerToRoman", function () {
  let integerToRoman;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const IntegerToRoman = await ethers.getContractFactory("IntegerToRoman");
    integerToRoman = await IntegerToRoman.deploy();
    await integerToRoman.waitForDeployment();
  });

  describe("部署", function () {
    it("应该成功部署合约", async function () {
      expect(await integerToRoman.getAddress()).to.be.a("string");
      expect(await integerToRoman.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe("基本转换", function () {
    it("应该转换 1 为 I", async function () {
      expect(await integerToRoman.intToRoman(1)).to.equal("I");
    });

    it("应该转换 5 为 V", async function () {
      expect(await integerToRoman.intToRoman(5)).to.equal("V");
    });

    it("应该转换 10 为 X", async function () {
      expect(await integerToRoman.intToRoman(10)).to.equal("X");
    });

    it("应该转换 50 为 L", async function () {
      expect(await integerToRoman.intToRoman(50)).to.equal("L");
    });

    it("应该转换 100 为 C", async function () {
      expect(await integerToRoman.intToRoman(100)).to.equal("C");
    });

    it("应该转换 500 为 D", async function () {
      expect(await integerToRoman.intToRoman(500)).to.equal("D");
    });

    it("应该转换 1000 为 M", async function () {
      expect(await integerToRoman.intToRoman(1000)).to.equal("M");
    });
  });

  describe("加法规则", function () {
    it("应该转换 2 为 II", async function () {
      expect(await integerToRoman.intToRoman(2)).to.equal("II");
    });

    it("应该转换 3 为 III", async function () {
      expect(await integerToRoman.intToRoman(3)).to.equal("III");
    });

    it("应该转换 6 为 VI", async function () {
      expect(await integerToRoman.intToRoman(6)).to.equal("VI");
    });

    it("应该转换 7 为 VII", async function () {
      expect(await integerToRoman.intToRoman(7)).to.equal("VII");
    });

    it("应该转换 8 为 VIII", async function () {
      expect(await integerToRoman.intToRoman(8)).to.equal("VIII");
    });

    it("应该转换 12 为 XII", async function () {
      expect(await integerToRoman.intToRoman(12)).to.equal("XII");
    });

    it("应该转换 27 为 XXVII", async function () {
      expect(await integerToRoman.intToRoman(27)).to.equal("XXVII");
    });

    it("应该转换 58 为 LVIII", async function () {
      expect(await integerToRoman.intToRoman(58)).to.equal("LVIII");
    });
  });

  describe("减法规则", function () {
    it("应该转换 4 为 IV", async function () {
      expect(await integerToRoman.intToRoman(4)).to.equal("IV");
    });

    it("应该转换 9 为 IX", async function () {
      expect(await integerToRoman.intToRoman(9)).to.equal("IX");
    });

    it("应该转换 40 为 XL", async function () {
      expect(await integerToRoman.intToRoman(40)).to.equal("XL");
    });

    it("应该转换 90 为 XC", async function () {
      expect(await integerToRoman.intToRoman(90)).to.equal("XC");
    });

    it("应该转换 400 为 CD", async function () {
      expect(await integerToRoman.intToRoman(400)).to.equal("CD");
    });

    it("应该转换 900 为 CM", async function () {
      expect(await integerToRoman.intToRoman(900)).to.equal("CM");
    });
  });

  describe("复合规则", function () {
    it("应该转换 14 为 XIV", async function () {
      expect(await integerToRoman.intToRoman(14)).to.equal("XIV");
    });

    it("应该转换 1994 为 MCMXCIV", async function () {
      expect(await integerToRoman.intToRoman(1994)).to.equal("MCMXCIV");
    });

    it("应该转换 1444 为 MCDXLIV", async function () {
      expect(await integerToRoman.intToRoman(1444)).to.equal("MCDXLIV");
    });

    it("应该转换 2444 为 MMCDXLIV", async function () {
      expect(await integerToRoman.intToRoman(2444)).to.equal("MMCDXLIV");
    });

    it("应该转换 3999 为 MMMCMXCIX", async function () {
      expect(await integerToRoman.intToRoman(3999)).to.equal("MMMCMXCIX");
    });
  });

  describe("边界情况", function () {
    it("应该转换最小值 1", async function () {
      expect(await integerToRoman.intToRoman(1)).to.equal("I");
    });

    it("应该转换最大值 3999", async function () {
      expect(await integerToRoman.intToRoman(3999)).to.equal("MMMCMXCIX");
    });

    it("应该拒绝 0", async function () {
      await expect(integerToRoman.intToRoman(0)).to.be.revertedWith("Number must be between 1 and 3999");
    });

    it("应该拒绝大于 3999 的数字", async function () {
      await expect(integerToRoman.intToRoman(4000)).to.be.revertedWith("Number must be between 1 and 3999");
    });

    it("应该拒绝非常大的数字", async function () {
      await expect(integerToRoman.intToRoman(10000)).to.be.revertedWith("Number must be between 1 and 3999");
    });
  });

  describe("批量转换", function () {
    it("应该批量转换多个数字", async function () {
      const nums = [1, 4, 9, 10, 40, 90, 100, 400, 900, 1000];
      const results = await integerToRoman.batchConvert(nums);
      
      expect(results.length).to.equal(nums.length);
      expect(results[0]).to.equal("I");      // 1
      expect(results[1]).to.equal("IV");     // 4
      expect(results[2]).to.equal("IX");     // 9
      expect(results[3]).to.equal("X");      // 10
      expect(results[4]).to.equal("XL");     // 40
      expect(results[5]).to.equal("XC");     // 90
      expect(results[6]).to.equal("C");      // 100
      expect(results[7]).to.equal("CD");     // 400
      expect(results[8]).to.equal("CM");     // 900
      expect(results[9]).to.equal("M");      // 1000
    });

    it("应该处理空数组", async function () {
      const results = await integerToRoman.batchConvert([]);
      expect(results.length).to.equal(0);
    });

    it("应该处理单个元素", async function () {
      const results = await integerToRoman.batchConvert([1994]);
      expect(results.length).to.equal(1);
      expect(results[0]).to.equal("MCMXCIV");
    });

    it("应该处理大量元素", async function () {
      const nums = Array(10).fill(1994);
      const results = await integerToRoman.batchConvert(nums);
      expect(results.length).to.equal(10);
      results.forEach(result => {
        expect(result).to.equal("MCMXCIV");
      });
    });
  });

  describe("辅助函数", function () {
    it("应该返回最大值 3999", async function () {
      expect(await integerToRoman.getMaxValue()).to.equal(3999);
    });

    it("应该返回最小值 1", async function () {
      expect(await integerToRoman.getMinValue()).to.equal(1);
    });

    it("应该验证转换结果不为空", async function () {
      const roman = await integerToRoman.intToRoman(1994);
      const isValid = await integerToRoman.verifyConversion(roman, 1994);
      expect(isValid).to.be.true;
    });
  });

  describe("特殊场景", function () {
    it("应该转换只包含千位的数字", async function () {
      expect(await integerToRoman.intToRoman(2000)).to.equal("MM");
      expect(await integerToRoman.intToRoman(3000)).to.equal("MMM");
    });

    it("应该转换只包含百位的数字", async function () {
      expect(await integerToRoman.intToRoman(100)).to.equal("C");
      expect(await integerToRoman.intToRoman(200)).to.equal("CC");
      expect(await integerToRoman.intToRoman(300)).to.equal("CCC");
    });

    it("应该转换只包含十位的数字", async function () {
      expect(await integerToRoman.intToRoman(20)).to.equal("XX");
      expect(await integerToRoman.intToRoman(30)).to.equal("XXX");
    });

    it("应该转换只包含个位的数字", async function () {
      expect(await integerToRoman.intToRoman(2)).to.equal("II");
      expect(await integerToRoman.intToRoman(3)).to.equal("III");
    });

    it("应该转换包含所有位数的数字", async function () {
      expect(await integerToRoman.intToRoman(1994)).to.equal("MCMXCIV");
      expect(await integerToRoman.intToRoman(2444)).to.equal("MMCDXLIV");
      expect(await integerToRoman.intToRoman(3999)).to.equal("MMMCMXCIX");
    });
  });

  describe("一致性测试", function () {
    it("应该与预期值一致", async function () {
      const testCases = [
        { num: 1, expected: "I" },
        { num: 4, expected: "IV" },
        { num: 9, expected: "IX" },
        { num: 40, expected: "XL" },
        { num: 90, expected: "XC" },
        { num: 400, expected: "CD" },
        { num: 900, expected: "CM" },
        { num: 1994, expected: "MCMXCIV" },
        { num: 3999, expected: "MMMCMXCIX" },
      ];

      for (const testCase of testCases) {
        const result = await integerToRoman.intToRoman(testCase.num);
        expect(result).to.equal(testCase.expected, `Failed for: ${testCase.num}`);
      }
    });

    it("应该正确处理所有边界值", async function () {
      expect(await integerToRoman.intToRoman(1)).to.equal("I");
      expect(await integerToRoman.intToRoman(3999)).to.equal("MMMCMXCIX");
      
      await expect(integerToRoman.intToRoman(0)).to.be.reverted;
      await expect(integerToRoman.intToRoman(4000)).to.be.reverted;
    });
  });
});

