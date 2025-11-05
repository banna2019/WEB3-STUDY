const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BeggingContract", function () {
  let beggingContract;
  let owner;
  let donor1;
  let donor2;
  let donor3;
  let stranger;

  beforeEach(async function () {
    // 获取签名者
    [owner, donor1, donor2, donor3, stranger] = await ethers.getSigners();

    // 部署合约
    const BeggingContract = await ethers.getContractFactory("BeggingContract");
    beggingContract = await BeggingContract.deploy();
    await beggingContract.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置合约所有者", async function () {
      expect(await beggingContract.owner()).to.equal(owner.address);
    });

    it("初始合约余额应该为 0", async function () {
      expect(await beggingContract.getBalance()).to.equal(0);
    });

    it("初始总捐赠金额应该为 0", async function () {
      expect(await beggingContract.getTotalDonations()).to.equal(0);
    });

    it("初始捐赠者数量应该为 0", async function () {
      expect(await beggingContract.getDonorCount()).to.equal(0);
    });
  });

  describe("donate 功能", function () {
    it("应该允许用户捐赠以太币", async function () {
      const donationAmount = ethers.parseEther("1");
      
      await expect(
        beggingContract.connect(donor1).donate({ value: donationAmount })
      )
        .to.emit(beggingContract, "Donation")
        .withArgs(donor1.address, donationAmount, (value) => typeof value === "bigint");

      expect(await beggingContract.getDonation(donor1.address)).to.equal(donationAmount);
      expect(await beggingContract.getBalance()).to.equal(donationAmount);
      expect(await beggingContract.getTotalDonations()).to.equal(donationAmount);
      expect(await beggingContract.getDonorCount()).to.equal(1);
    });

    it("应该拒绝零金额捐赠", async function () {
      await expect(
        beggingContract.connect(donor1).donate({ value: 0 })
      ).to.be.revertedWith("Donation amount must be greater than 0");
    });

    it("应该允许同一用户多次捐赠", async function () {
      const amount1 = ethers.parseEther("1");
      const amount2 = ethers.parseEther("0.5");
      const totalAmount = amount1 + amount2;

      await beggingContract.connect(donor1).donate({ value: amount1 });
      await beggingContract.connect(donor1).donate({ value: amount2 });

      expect(await beggingContract.getDonation(donor1.address)).to.equal(totalAmount);
      expect(await beggingContract.getTotalDonations()).to.equal(totalAmount);
      expect(await beggingContract.getDonorCount()).to.equal(1); // 同一捐赠者只计数一次
    });

    it("应该允许多个用户捐赠", async function () {
      const amount1 = ethers.parseEther("1");
      const amount2 = ethers.parseEther("2");
      const amount3 = ethers.parseEther("0.5");

      await beggingContract.connect(donor1).donate({ value: amount1 });
      await beggingContract.connect(donor2).donate({ value: amount2 });
      await beggingContract.connect(donor3).donate({ value: amount3 });

      expect(await beggingContract.getDonation(donor1.address)).to.equal(amount1);
      expect(await beggingContract.getDonation(donor2.address)).to.equal(amount2);
      expect(await beggingContract.getDonation(donor3.address)).to.equal(amount3);
      expect(await beggingContract.getDonorCount()).to.equal(3);
      expect(await beggingContract.getTotalDonations()).to.equal(amount1 + amount2 + amount3);
    });

    it("应该正确更新合约余额", async function () {
      const amount1 = ethers.parseEther("1");
      const amount2 = ethers.parseEther("2");

      await beggingContract.connect(donor1).donate({ value: amount1 });
      expect(await beggingContract.getBalance()).to.equal(amount1);

      await beggingContract.connect(donor2).donate({ value: amount2 });
      expect(await beggingContract.getBalance()).to.equal(amount1 + amount2);
    });
  });

  describe("receive 和 fallback 功能", function () {
    it("应该通过 receive 函数接收捐赠", async function () {
      const amount = ethers.parseEther("1");
      
      await expect(
        donor1.sendTransaction({
          to: await beggingContract.getAddress(),
          value: amount,
        })
      )
        .to.emit(beggingContract, "Donation")
        .withArgs(donor1.address, amount, (value) => typeof value === "bigint");

      expect(await beggingContract.getDonation(donor1.address)).to.equal(amount);
    });

    it("应该通过 fallback 函数接收捐赠", async function () {
      const amount = ethers.parseEther("0.5");
      const contractAddress = await beggingContract.getAddress();
      
      // 使用不存在的函数调用，触发 fallback
      await expect(
        donor1.sendTransaction({
          to: contractAddress,
          value: amount,
          data: "0x1234", // 无效的函数选择器
        })
      )
        .to.emit(beggingContract, "Donation")
        .withArgs(donor1.address, amount, (value) => typeof value === "bigint");

      expect(await beggingContract.getDonation(donor1.address)).to.equal(amount);
    });
  });

  describe("withdraw 功能", function () {
    beforeEach(async function () {
      // 先进行一些捐赠
      await beggingContract.connect(donor1).donate({ value: ethers.parseEther("1") });
      await beggingContract.connect(donor2).donate({ value: ethers.parseEther("2") });
    });

    it("应该允许所有者提取所有资金", async function () {
      const contractBalance = await beggingContract.getBalance();
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      await expect(beggingContract.connect(owner).withdraw())
        .to.emit(beggingContract, "Withdrawal")
        .withArgs(owner.address, contractBalance, (value) => typeof value === "bigint");

      expect(await beggingContract.getBalance()).to.equal(0);
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      // 注意：由于 gas 费用，余额可能不完全相等
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });

    it("应该拒绝非所有者提取资金", async function () {
      await expect(
        beggingContract.connect(stranger).withdraw()
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("应该拒绝提取零余额", async function () {
      // 先提取所有资金
      await beggingContract.connect(owner).withdraw();
      
      // 再次尝试提取
      await expect(
        beggingContract.connect(owner).withdraw()
      ).to.be.revertedWith("No funds to withdraw");
    });

    it("应该正确更新合约余额", async function () {
      const balanceBefore = await beggingContract.getBalance();
      await beggingContract.connect(owner).withdraw();
      const balanceAfter = await beggingContract.getBalance();
      
      expect(balanceAfter).to.equal(0);
      expect(balanceBefore).to.be.gt(0);
    });
  });

  describe("getDonation 功能", function () {
    it("应该返回未捐赠地址的零金额", async function () {
      expect(await beggingContract.getDonation(stranger.address)).to.equal(0);
    });

    it("应该正确返回捐赠金额", async function () {
      const amount = ethers.parseEther("1.5");
      await beggingContract.connect(donor1).donate({ value: amount });
      
      expect(await beggingContract.getDonation(donor1.address)).to.equal(amount);
    });

    it("应该正确返回累计捐赠金额", async function () {
      const amount1 = ethers.parseEther("1");
      const amount2 = ethers.parseEther("0.5");
      
      await beggingContract.connect(donor1).donate({ value: amount1 });
      await beggingContract.connect(donor1).donate({ value: amount2 });
      
      expect(await beggingContract.getDonation(donor1.address)).to.equal(amount1 + amount2);
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      await beggingContract.connect(donor1).donate({ value: ethers.parseEther("1") });
      await beggingContract.connect(donor2).donate({ value: ethers.parseEther("2") });
      await beggingContract.connect(donor3).donate({ value: ethers.parseEther("0.5") });
    });

    it("应该正确返回捐赠者数量", async function () {
      expect(await beggingContract.getDonorCount()).to.equal(3);
    });

    it("应该正确返回指定索引的捐赠者", async function () {
      expect(await beggingContract.getDonor(0)).to.equal(donor1.address);
      expect(await beggingContract.getDonor(1)).to.equal(donor2.address);
      expect(await beggingContract.getDonor(2)).to.equal(donor3.address);
    });

    it("应该拒绝越界索引", async function () {
      await expect(
        beggingContract.getDonor(999)
      ).to.be.revertedWith("Index out of bounds");
    });

    it("应该正确返回总捐赠金额", async function () {
      const total = ethers.parseEther("3.5");
      expect(await beggingContract.getTotalDonations()).to.equal(total);
    });

    it("应该正确返回合约余额", async function () {
      const balance = ethers.parseEther("3.5");
      expect(await beggingContract.getBalance()).to.equal(balance);
    });
  });

  describe("综合场景", function () {
    it("应该支持完整的捐赠和提取流程", async function () {
      // 1. 多个用户捐赠
      const amount1 = ethers.parseEther("1");
      const amount2 = ethers.parseEther("2");
      
      await beggingContract.connect(donor1).donate({ value: amount1 });
      await beggingContract.connect(donor2).donate({ value: amount2 });
      
      expect(await beggingContract.getBalance()).to.equal(amount1 + amount2);
      expect(await beggingContract.getDonorCount()).to.equal(2);
      
      // 2. 查询捐赠记录
      expect(await beggingContract.getDonation(donor1.address)).to.equal(amount1);
      expect(await beggingContract.getDonation(donor2.address)).to.equal(amount2);
      
      // 3. 所有者提取资金
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      await beggingContract.connect(owner).withdraw();
      
      expect(await beggingContract.getBalance()).to.equal(0);
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
      
      // 4. 提取后捐赠记录仍然保留
      expect(await beggingContract.getDonation(donor1.address)).to.equal(amount1);
      expect(await beggingContract.getDonation(donor2.address)).to.equal(amount2);
      expect(await beggingContract.getTotalDonations()).to.equal(amount1 + amount2);
    });

    it("应该支持提取后继续接收捐赠", async function () {
      // 第一次捐赠
      await beggingContract.connect(donor1).donate({ value: ethers.parseEther("1") });
      
      // 提取
      await beggingContract.connect(owner).withdraw();
      expect(await beggingContract.getBalance()).to.equal(0);
      
      // 继续捐赠
      await beggingContract.connect(donor2).donate({ value: ethers.parseEther("2") });
      
      expect(await beggingContract.getBalance()).to.equal(ethers.parseEther("2"));
      expect(await beggingContract.getDonorCount()).to.equal(2);
      expect(await beggingContract.getTotalDonations()).to.equal(ethers.parseEther("3"));
    });
  });

  describe("边界情况", function () {
    it("应该处理最小金额捐赠", async function () {
      const minAmount = 1; // 1 wei
      await beggingContract.connect(donor1).donate({ value: minAmount });
      
      expect(await beggingContract.getDonation(donor1.address)).to.equal(minAmount);
      expect(await beggingContract.getBalance()).to.equal(minAmount);
    });

    it("应该处理大金额捐赠", async function () {
      const largeAmount = ethers.parseEther("1000");
      await beggingContract.connect(donor1).donate({ value: largeAmount });
      
      expect(await beggingContract.getDonation(donor1.address)).to.equal(largeAmount);
      expect(await beggingContract.getBalance()).to.equal(largeAmount);
    });
  });
});

