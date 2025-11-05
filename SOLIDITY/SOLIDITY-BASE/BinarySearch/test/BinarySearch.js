const { expect } = require("chai");
const { ethers } = require("hardhat");

// 定义 type(uint256).max 的 JavaScript 表示
const NOT_FOUND = BigInt(2**256) - 1n;

describe("BinarySearch", function () {
  let binarySearch;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const BinarySearch = await ethers.getContractFactory("BinarySearch");
    binarySearch = await BinarySearch.deploy();
    await binarySearch.waitForDeployment();
  });

  describe("部署", function () {
    it("应该成功部署合约", async function () {
      expect(await binarySearch.getAddress()).to.be.a("string");
      expect(await binarySearch.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe("binarySearch 函数", function () {
    it("应该在有序数组中找到目标值", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 3;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(2);
    });

    it("应该找到数组第一个元素", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 1;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(0);
    });

    it("应该找到数组最后一个元素", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 5;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(4);
    });

    it("应该找不到不存在的目标值", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 6;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该找不到小于最小值的目标值", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 0;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该处理空数组", async function () {
      const nums = [];
      const target = 1;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该处理单元素数组（找到）", async function () {
      const nums = [5];
      const target = 5;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(0);
    });

    it("应该处理单元素数组（未找到）", async function () {
      const nums = [5];
      const target = 3;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该处理大数组", async function () {
      const nums = Array.from({ length: 100 }, (_, i) => i + 1);
      const target = 50;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(49);
    });

    it("应该处理包含重复元素的数组", async function () {
      const nums = [1, 2, 2, 2, 3, 4, 5];
      const target = 2;
      const result = await binarySearch.binarySearch(nums, target);
      // 应该返回其中一个 2 的索引（可能是 1, 2, 或 3）
      expect([1, 2, 3]).to.include(Number(result));
    });
  });

  describe("search 函数", function () {
    it("应该返回 true 当目标值存在", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 3;
      const result = await binarySearch.search(nums, target);
      expect(result).to.be.true;
    });

    it("应该返回 false 当目标值不存在", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 6;
      const result = await binarySearch.search(nums, target);
      expect(result).to.be.false;
    });

    it("应该处理空数组", async function () {
      const nums = [];
      const target = 1;
      const result = await binarySearch.search(nums, target);
      expect(result).to.be.false;
    });
  });

  describe("findFirst 函数", function () {
    it("应该找到第一次出现的索引", async function () {
      const nums = [1, 2, 2, 2, 3, 4, 5];
      const target = 2;
      const result = await binarySearch.findFirst(nums, target);
      expect(result).to.equal(1);
    });

    it("应该找到唯一元素的索引", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 3;
      const result = await binarySearch.findFirst(nums, target);
      expect(result).to.equal(2);
    });

    it("应该返回 NOT_FOUND 当目标值不存在", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 6;
      const result = await binarySearch.findFirst(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该处理所有元素都相同的情况", async function () {
      const nums = [2, 2, 2, 2, 2];
      const target = 2;
      const result = await binarySearch.findFirst(nums, target);
      expect(result).to.equal(0);
    });
  });

  describe("findLast 函数", function () {
    it("应该找到最后一次出现的索引", async function () {
      const nums = [1, 2, 2, 2, 3, 4, 5];
      const target = 2;
      const result = await binarySearch.findLast(nums, target);
      expect(result).to.equal(3);
    });

    it("应该找到唯一元素的索引", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 3;
      const result = await binarySearch.findLast(nums, target);
      expect(result).to.equal(2);
    });

    it("应该返回 NOT_FOUND 当目标值不存在", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 6;
      const result = await binarySearch.findLast(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该处理所有元素都相同的情况", async function () {
      const nums = [2, 2, 2, 2, 2];
      const target = 2;
      const result = await binarySearch.findLast(nums, target);
      expect(result).to.equal(4);
    });
  });

  describe("searchInsert 函数", function () {
    it("应该找到已存在元素的插入位置", async function () {
      const nums = [1, 3, 5, 6];
      const target = 5;
      const result = await binarySearch.searchInsert(nums, target);
      expect(result).to.equal(2);
    });

    it("应该找到新元素的插入位置（在中间）", async function () {
      const nums = [1, 3, 5, 6];
      const target = 2;
      const result = await binarySearch.searchInsert(nums, target);
      expect(result).to.equal(1);
    });

    it("应该找到新元素的插入位置（在开头）", async function () {
      const nums = [1, 3, 5, 6];
      const target = 0;
      const result = await binarySearch.searchInsert(nums, target);
      expect(result).to.equal(0);
    });

    it("应该找到新元素的插入位置（在末尾）", async function () {
      const nums = [1, 3, 5, 6];
      const target = 7;
      const result = await binarySearch.searchInsert(nums, target);
      expect(result).to.equal(4);
    });

    it("应该处理空数组", async function () {
      const nums = [];
      const target = 1;
      const result = await binarySearch.searchInsert(nums, target);
      expect(result).to.equal(0);
    });
  });

  describe("findLowerBound 函数", function () {
    it("应该找到小于目标值的最大元素索引", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 4;
      const result = await binarySearch.findLowerBound(nums, target);
      expect(result).to.equal(2); // 3 是小于 4 的最大元素
    });

    it("应该返回 NOT_FOUND 当所有元素都大于等于目标值", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 1;
      const result = await binarySearch.findLowerBound(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该返回 NOT_FOUND 当目标值小于所有元素", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 0;
      const result = await binarySearch.findLowerBound(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该处理空数组", async function () {
      const nums = [];
      const target = 1;
      const result = await binarySearch.findLowerBound(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });
  });

  describe("findUpperBound 函数", function () {
    it("应该找到大于目标值的最小元素索引", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 2;
      const result = await binarySearch.findUpperBound(nums, target);
      expect(result).to.equal(2); // 3 是大于 2 的最小元素
    });

    it("应该返回 NOT_FOUND 当所有元素都小于等于目标值", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 5;
      const result = await binarySearch.findUpperBound(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该返回 NOT_FOUND 当目标值大于所有元素", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 6;
      const result = await binarySearch.findUpperBound(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });

    it("应该处理空数组", async function () {
      const nums = [];
      const target = 1;
      const result = await binarySearch.findUpperBound(nums, target);
      expect(result).to.equal(NOT_FOUND);
    });
  });

  describe("isSorted 函数", function () {
    it("应该验证已排序的数组", async function () {
      const nums = [1, 2, 3, 4, 5];
      expect(await binarySearch.isSorted(nums)).to.be.true;
    });

    it("应该拒绝未排序的数组", async function () {
      const nums = [1, 3, 2, 4, 5];
      expect(await binarySearch.isSorted(nums)).to.be.false;
    });

    it("应该处理空数组", async function () {
      const nums = [];
      expect(await binarySearch.isSorted(nums)).to.be.true;
    });

    it("应该处理单元素数组", async function () {
      const nums = [1];
      expect(await binarySearch.isSorted(nums)).to.be.true;
    });

    it("应该处理包含重复元素的已排序数组", async function () {
      const nums = [1, 2, 2, 3, 3, 4];
      expect(await binarySearch.isSorted(nums)).to.be.true;
    });

    it("应该处理降序数组", async function () {
      const nums = [5, 4, 3, 2, 1];
      expect(await binarySearch.isSorted(nums)).to.be.false;
    });
  });

  describe("边界情况", function () {
    it("应该处理大数组", async function () {
      const nums = Array.from({ length: 1000 }, (_, i) => i + 1);
      const target = 500;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(499);
    });

    it("应该处理包含大数字的数组", async function () {
      const nums = [1000000, 2000000, 3000000, 4000000, 5000000];
      const target = 3000000;
      const result = await binarySearch.binarySearch(nums, target);
      expect(result).to.equal(2);
    });

    it("应该处理边界值", async function () {
      const nums = [1, 2, 3];
      const result1 = await binarySearch.binarySearch(nums, 1);
      const result2 = await binarySearch.binarySearch(nums, 3);
      expect(result1).to.equal(0);
      expect(result2).to.equal(2);
    });
  });

  describe("一致性测试", function () {
    it("binarySearch 和 search 应该一致", async function () {
      const nums = [1, 2, 3, 4, 5];
      const target = 3;
      
      const index = await binarySearch.binarySearch(nums, target);
      const exists = await binarySearch.search(nums, target);
      
      expect(exists).to.equal(index !== NOT_FOUND);
    });

    it("应该正确处理所有边界值", async function () {
      const nums = [1, 2, 3, 4, 5];
      const testCases = [
        { target: 1, expectedIndex: 0 },
        { target: 3, expectedIndex: 2 },
        { target: 5, expectedIndex: 4 },
        { target: 0, expectedIndex: NOT_FOUND },
        { target: 6, expectedIndex: NOT_FOUND },
      ];

      for (const testCase of testCases) {
        const result = await binarySearch.binarySearch(nums, testCase.target);
        expect(result).to.equal(testCase.expectedIndex, `Failed for target: ${testCase.target}`);
      }
    });
  });
});

