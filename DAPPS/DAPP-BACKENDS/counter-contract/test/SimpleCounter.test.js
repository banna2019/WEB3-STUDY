const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleCounter", function () {
  let counter;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Counter = await ethers.getContractFactory("SimpleCounter");
    counter = await Counter.deploy();
    await counter.waitForDeployment();
  });

  describe("部署", function () {
    it("应该将计数器初始化为 0", async function () {
      expect(await counter.getCount()).to.equal(0);
    });
  });

  describe("increment 函数", function () {
    it("应该能够增加计数器值", async function () {
      await counter.increment();
      expect(await counter.getCount()).to.equal(1);
    });

    it("应该能够多次增加计数器值", async function () {
      await counter.increment();
      await counter.increment();
      await counter.increment();
      expect(await counter.getCount()).to.equal(3);
    });

    it("应该返回新的计数器值", async function () {
      // 调用 increment 并等待交易确认
      const tx = await counter.increment();
      await tx.wait();
      
      // 验证计数器值已更新
      const count = await counter.getCount();
      expect(count).to.equal(1);
    });

    it("应该发出 CountChanged 事件", async function () {
      await expect(counter.increment())
        .to.emit(counter, "CountChanged")
        .withArgs(0, 1);
    });

    it("应该允许任何地址调用", async function () {
      await counter.connect(addr1).increment();
      expect(await counter.getCount()).to.equal(1);
    });
  });

  describe("decrement 函数", function () {
    it("应该能够减少计数器值", async function () {
      await counter.increment();
      await counter.increment();
      await counter.decrement();
      expect(await counter.getCount()).to.equal(1);
    });

    it("应该返回新的计数器值", async function () {
      await counter.increment();
      
      // 调用 decrement 并等待交易确认
      const tx = await counter.decrement();
      await tx.wait();
      
      // 验证计数器值已更新
      const count = await counter.getCount();
      expect(count).to.equal(0);
    });

    it("应该发出 CountChanged 事件", async function () {
      await counter.increment();
      await expect(counter.decrement())
        .to.emit(counter, "CountChanged")
        .withArgs(1, 0);
    });

    it("应该拒绝将计数器减少到负数", async function () {
      await expect(counter.decrement()).to.be.revertedWith(
        "Counter cannot be negative"
      );
    });

    it("应该允许任何地址调用", async function () {
      await counter.increment();
      await counter.connect(addr1).decrement();
      expect(await counter.getCount()).to.equal(0);
    });
  });

  describe("getCount 函数", function () {
    it("应该返回当前计数器值", async function () {
      expect(await counter.getCount()).to.equal(0);
    });

    it("应该正确反映计数器的变化", async function () {
      await counter.increment();
      expect(await counter.getCount()).to.equal(1);

      await counter.increment();
      expect(await counter.getCount()).to.equal(2);

      await counter.decrement();
      expect(await counter.getCount()).to.equal(1);
    });

    it("应该是一个 view 函数，不消耗 Gas", async function () {
      // view 函数不修改状态，应该可以免费调用
      const count = await counter.getCount();
      expect(count).to.be.a("bigint");
    });
  });

  describe("reset 函数", function () {
    it("应该能够重置计数器为 0", async function () {
      await counter.increment();
      await counter.increment();
      await counter.increment();
      expect(await counter.getCount()).to.equal(3);

      await counter.reset();
      expect(await counter.getCount()).to.equal(0);
    });

    it("应该发出 CountChanged 事件", async function () {
      await counter.increment();
      await counter.increment();
      await expect(counter.reset())
        .to.emit(counter, "CountChanged")
        .withArgs(2, 0);
    });

    it("应该允许任何地址调用", async function () {
      await counter.increment();
      await counter.connect(addr1).reset();
      expect(await counter.getCount()).to.equal(0);
    });

    it("应该能够重置已经为 0 的计数器", async function () {
      await counter.reset();
      expect(await counter.getCount()).to.equal(0);
    });
  });

  describe("综合测试", function () {
    it("应该正确处理完整的计数器操作流程", async function () {
      // 初始状态
      expect(await counter.getCount()).to.equal(0);

      // 增加 5 次
      for (let i = 0; i < 5; i++) {
        await counter.increment();
      }
      expect(await counter.getCount()).to.equal(5);

      // 减少 2 次
      await counter.decrement();
      await counter.decrement();
      expect(await counter.getCount()).to.equal(3);

      // 重置
      await counter.reset();
      expect(await counter.getCount()).to.equal(0);

      // 再次增加
      await counter.increment();
      expect(await counter.getCount()).to.equal(1);
    });

    it("应该正确处理多个用户的操作", async function () {
      await counter.connect(owner).increment();
      expect(await counter.getCount()).to.equal(1);

      await counter.connect(addr1).increment();
      expect(await counter.getCount()).to.equal(2);

      await counter.connect(addr2).increment();
      expect(await counter.getCount()).to.equal(3);

      await counter.connect(owner).decrement();
      expect(await counter.getCount()).to.equal(2);
    });
  });
});

