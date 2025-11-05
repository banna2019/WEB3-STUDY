const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MergeSortedArrays", function () {
  let mergeSortedArrays;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const MergeSortedArrays = await ethers.getContractFactory("MergeSortedArrays");
    mergeSortedArrays = await MergeSortedArrays.deploy();
    await mergeSortedArrays.waitForDeployment();
  });

  describe("部署", function () {
    it("应该成功部署合约", async function () {
      expect(await mergeSortedArrays.getAddress()).to.be.a("string");
      expect(await mergeSortedArrays.getAddress()).to.match(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe("基本合并功能", function () {
    it("应该合并两个非空数组", async function () {
      const nums1 = [1, 2, 3];
      const nums2 = [4, 5, 6];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3, 4, 5, 6]);
    });

    it("应该合并两个有重叠元素的数组", async function () {
      const nums1 = [1, 3, 5];
      const nums2 = [2, 4, 6];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3, 4, 5, 6]);
    });

    it("应该合并包含重复元素的数组", async function () {
      const nums1 = [1, 2, 3];
      const nums2 = [2, 3, 4];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 2, 3, 3, 4]);
    });

    it("应该合并第一个数组为空的情况", async function () {
      const nums1 = [];
      const nums2 = [1, 2, 3];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3]);
    });

    it("应该合并第二个数组为空的情况", async function () {
      const nums1 = [1, 2, 3];
      const nums2 = [];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3]);
    });

    it("应该合并两个空数组", async function () {
      const nums1 = [];
      const nums2 = [];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.length).to.equal(0);
    });

    it("应该合并单个元素数组", async function () {
      const nums1 = [1];
      const nums2 = [2];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2]);
    });
  });

  describe("边界情况", function () {
    it("应该处理 nums1 全部小于 nums2", async function () {
      const nums1 = [1, 2, 3];
      const nums2 = [10, 20, 30];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3, 10, 20, 30]);
    });

    it("应该处理 nums2 全部小于 nums1", async function () {
      const nums1 = [10, 20, 30];
      const nums2 = [1, 2, 3];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3, 10, 20, 30]);
    });

    it("应该处理不同长度的数组", async function () {
      const nums1 = [1, 3, 5, 7, 9];
      const nums2 = [2, 4];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3, 4, 5, 7, 9]);
    });

    it("应该处理大数字", async function () {
      const nums1 = [1000000, 2000000];
      const nums2 = [1500000];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      expect(result.map(v => Number(v))).to.deep.equal([1000000, 1500000, 2000000]);
    });
  });

  describe("mergeMultipleArrays 函数", function () {
    it("应该合并多个数组", async function () {
      const arrays = [[1, 3], [2, 4], [5, 6]];
      const result = await mergeSortedArrays.mergeMultipleArrays(arrays);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3, 4, 5, 6]);
    });

    it("应该处理空数组", async function () {
      const arrays = [];
      const result = await mergeSortedArrays.mergeMultipleArrays(arrays);
      expect(result.length).to.equal(0);
    });

    it("应该处理单个数组", async function () {
      const arrays = [[1, 2, 3]];
      const result = await mergeSortedArrays.mergeMultipleArrays(arrays);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3]);
    });

    it("应该处理两个数组", async function () {
      const arrays = [[1, 3, 5], [2, 4, 6]];
      const result = await mergeSortedArrays.mergeMultipleArrays(arrays);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3, 4, 5, 6]);
    });

    it("应该处理奇数个数组", async function () {
      const arrays = [[1, 3], [2, 4], [5, 6], [7, 8], [9]];
      const result = await mergeSortedArrays.mergeMultipleArrays(arrays);
      expect(result.map(v => Number(v))).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe("isSorted 函数", function () {
    it("应该验证已排序的数组", async function () {
      const arr = [1, 2, 3, 4, 5];
      expect(await mergeSortedArrays.isSorted(arr)).to.be.true;
    });

    it("应该拒绝未排序的数组", async function () {
      const arr = [1, 3, 2, 4, 5];
      expect(await mergeSortedArrays.isSorted(arr)).to.be.false;
    });

    it("应该处理空数组", async function () {
      const arr = [];
      expect(await mergeSortedArrays.isSorted(arr)).to.be.true;
    });

    it("应该处理单元素数组", async function () {
      const arr = [1];
      expect(await mergeSortedArrays.isSorted(arr)).to.be.true;
    });

    it("应该处理包含重复元素的已排序数组", async function () {
      const arr = [1, 2, 2, 3, 3, 4];
      expect(await mergeSortedArrays.isSorted(arr)).to.be.true;
    });

    it("应该验证合并后的数组是已排序的", async function () {
      const nums1 = [1, 3, 5];
      const nums2 = [2, 4, 6];
      const result = await mergeSortedArrays.mergeSortedArrays(nums1, nums2);
      // 将 BigInt 数组转换为 Number 数组，因为 isSorted 需要可修改的数组
      const resultNumbers = result.map(v => Number(v));
      const isSorted = await mergeSortedArrays.isSorted(resultNumbers);
      expect(isSorted).to.be.true;
    });
  });

  describe("getMergedLength 函数", function () {
    it("应该返回正确的合并后长度", async function () {
      const nums1 = [1, 2, 3];
      const nums2 = [4, 5];
      const length = await mergeSortedArrays.getMergedLength(nums1, nums2);
      expect(length).to.equal(5);
    });

    it("应该处理空数组", async function () {
      const nums1 = [];
      const nums2 = [1, 2];
      const length = await mergeSortedArrays.getMergedLength(nums1, nums2);
      expect(length).to.equal(2);
    });

    it("应该处理两个空数组", async function () {
      const nums1 = [];
      const nums2 = [];
      const length = await mergeSortedArrays.getMergedLength(nums1, nums2);
      expect(length).to.equal(0);
    });
  });

  describe("getMaxValue 函数", function () {
    it("应该返回两个数组中的最大值", async function () {
      const nums1 = [1, 3, 5];
      const nums2 = [2, 4, 8];
      const maxValue = await mergeSortedArrays.getMaxValue(nums1, nums2);
      expect(maxValue).to.equal(8);
    });

    it("应该处理第一个数组的最大值更大", async function () {
      const nums1 = [1, 3, 10];
      const nums2 = [2, 4, 6];
      const maxValue = await mergeSortedArrays.getMaxValue(nums1, nums2);
      expect(maxValue).to.equal(10);
    });

    it("应该处理第二个数组的最大值更大", async function () {
      const nums1 = [1, 3, 5];
      const nums2 = [2, 4, 10];
      const maxValue = await mergeSortedArrays.getMaxValue(nums1, nums2);
      expect(maxValue).to.equal(10);
    });

    it("应该处理空数组", async function () {
      const nums1 = [1, 3, 5];
      const nums2 = [];
      const maxValue = await mergeSortedArrays.getMaxValue(nums1, nums2);
      expect(maxValue).to.equal(5);
    });

    it("应该处理两个空数组", async function () {
      const nums1 = [];
      const nums2 = [];
      const maxValue = await mergeSortedArrays.getMaxValue(nums1, nums2);
      expect(maxValue).to.equal(0);
    });
  });

  describe("getMinValue 函数", function () {
    it("应该返回两个数组中的最小值", async function () {
      const nums1 = [3, 5, 7];
      const nums2 = [1, 4, 6];
      const minValue = await mergeSortedArrays.getMinValue(nums1, nums2);
      expect(minValue).to.equal(1);
    });

    it("应该处理第一个数组的最小值更小", async function () {
      const nums1 = [1, 3, 5];
      const nums2 = [2, 4, 6];
      const minValue = await mergeSortedArrays.getMinValue(nums1, nums2);
      expect(minValue).to.equal(1);
    });

    it("应该处理第二个数组的最小值更小", async function () {
      const nums1 = [3, 5, 7];
      const nums2 = [1, 4, 6];
      const minValue = await mergeSortedArrays.getMinValue(nums1, nums2);
      expect(minValue).to.equal(1);
    });

    it("应该处理空数组", async function () {
      const nums1 = [];
      const nums2 = [2, 4, 6];
      const minValue = await mergeSortedArrays.getMinValue(nums1, nums2);
      expect(minValue).to.equal(2);
    });
  });

  describe("一致性测试", function () {
    it("合并后的数组应该与预期一致", async function () {
      const testCases = [
        { nums1: [1, 2, 3], nums2: [4, 5, 6], expected: [1, 2, 3, 4, 5, 6] },
        { nums1: [1, 3, 5], nums2: [2, 4, 6], expected: [1, 2, 3, 4, 5, 6] },
        { nums1: [1, 2], nums2: [3, 4], expected: [1, 2, 3, 4] },
        { nums1: [], nums2: [1, 2, 3], expected: [1, 2, 3] },
        { nums1: [1, 2, 3], nums2: [], expected: [1, 2, 3] },
      ];

      for (const testCase of testCases) {
        const result = await mergeSortedArrays.mergeSortedArrays(testCase.nums1, testCase.nums2);
        expect(result.map(v => Number(v))).to.deep.equal(testCase.expected);
      }
    });

    it("合并后的数组应该保持排序", async function () {
      const testCases = [
        { nums1: [1, 3, 5], nums2: [2, 4, 6] },
        { nums1: [10, 20], nums2: [15, 25] },
        { nums1: [1, 1, 2], nums2: [1, 3] },
      ];

      for (const testCase of testCases) {
        const result = await mergeSortedArrays.mergeSortedArrays(testCase.nums1, testCase.nums2);
        // 将 BigInt 数组转换为 Number 数组，因为 isSorted 需要可修改的数组
        const resultNumbers = result.map(v => Number(v));
        const isSorted = await mergeSortedArrays.isSorted(resultNumbers);
        expect(isSorted).to.be.true;
      }
    });
  });
});

