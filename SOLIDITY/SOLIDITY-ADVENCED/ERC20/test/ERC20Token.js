const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Token", function () {
  let erc20Token;
  let owner;
  let user1;
  let user2;
  let user3;

  const tokenName = "Test Token";
  const tokenSymbol = "TST";
  const tokenDecimals = 18;
  const initialSupply = 1000000; // 100万代币

  beforeEach(async function () {
    // 获取签名者
    [owner, user1, user2, user3] = await ethers.getSigners();

    // 部署合约
    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    erc20Token = await ERC20Token.deploy(
      tokenName,
      tokenSymbol,
      tokenDecimals,
      initialSupply
    );
    await erc20Token.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置代币名称", async function () {
      expect(await erc20Token.name()).to.equal(tokenName);
    });

    it("应该正确设置代币符号", async function () {
      expect(await erc20Token.symbol()).to.equal(tokenSymbol);
    });

    it("应该正确设置代币精度", async function () {
      expect(await erc20Token.decimals()).to.equal(tokenDecimals);
    });

    it("应该正确设置合约所有者", async function () {
      expect(await erc20Token.owner()).to.equal(owner.address);
    });

    it("应该正确设置总供应量", async function () {
      const expectedSupply = BigInt(initialSupply) * BigInt(10 ** tokenDecimals);
      expect(await erc20Token.totalSupply()).to.equal(expectedSupply);
    });

    it("应该将初始供应量分配给部署者", async function () {
      const expectedBalance = BigInt(initialSupply) * BigInt(10 ** tokenDecimals);
      expect(await erc20Token.balanceOf(owner.address)).to.equal(expectedBalance);
    });
  });

  describe("transfer 功能", function () {
    it("应该允许转账代币", async function () {
      const amount = ethers.parseEther("100");
      await expect(erc20Token.connect(owner).transfer(user1.address, amount))
        .to.emit(erc20Token, "Transfer")
        .withArgs(owner.address, user1.address, amount);

      expect(await erc20Token.balanceOf(user1.address)).to.equal(amount);
    });

    it("应该正确更新发送者和接收者的余额", async function () {
      const amount = ethers.parseEther("100");
      const ownerBalanceBefore = await erc20Token.balanceOf(owner.address);
      const user1BalanceBefore = await erc20Token.balanceOf(user1.address);

      await erc20Token.connect(owner).transfer(user1.address, amount);

      expect(await erc20Token.balanceOf(owner.address)).to.equal(
        ownerBalanceBefore - amount
      );
      expect(await erc20Token.balanceOf(user1.address)).to.equal(
        user1BalanceBefore + amount
      );
    });

    it("应该拒绝零地址转账", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        erc20Token.connect(owner).transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Transfer to the zero address");
    });

    it("应该拒绝余额不足的转账", async function () {
      const ownerBalance = await erc20Token.balanceOf(owner.address);
      const excessiveAmount = ownerBalance + ethers.parseEther("1");

      await expect(
        erc20Token.connect(owner).transfer(user1.address, excessiveAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("应该返回 true 表示转账成功", async function () {
      const amount = ethers.parseEther("100");
      const result = await erc20Token
        .connect(owner)
        .transfer(user1.address, amount);
      expect(result).to.have.property("hash");
    });
  });

  describe("approve 功能", function () {
    it("应该允许授权其他地址使用代币", async function () {
      const amount = ethers.parseEther("1000");
      await expect(erc20Token.connect(owner).approve(user1.address, amount))
        .to.emit(erc20Token, "Approval")
        .withArgs(owner.address, user1.address, amount);

      expect(await erc20Token.allowance(owner.address, user1.address)).to.equal(
        amount
      );
    });

    it("应该拒绝授权给零地址", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        erc20Token.connect(owner).approve(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Approve to the zero address");
    });

    it("应该允许更新授权金额", async function () {
      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("2000");

      await erc20Token.connect(owner).approve(user1.address, amount1);
      expect(await erc20Token.allowance(owner.address, user1.address)).to.equal(
        amount1
      );

      await erc20Token.connect(owner).approve(user1.address, amount2);
      expect(await erc20Token.allowance(owner.address, user1.address)).to.equal(
        amount2
      );
    });
  });

  describe("transferFrom 功能", function () {
    beforeEach(async function () {
      // 先授权
      const amount = ethers.parseEther("1000");
      await erc20Token.connect(owner).approve(user1.address, amount);
    });

    it("应该允许被授权者从授权账户转账", async function () {
      const amount = ethers.parseEther("500");
      await expect(
        erc20Token
          .connect(user1)
          .transferFrom(owner.address, user2.address, amount)
      )
        .to.emit(erc20Token, "Transfer")
        .withArgs(owner.address, user2.address, amount);

      expect(await erc20Token.balanceOf(user2.address)).to.equal(amount);
    });

    it("应该正确更新授权金额", async function () {
      const approvedAmount = ethers.parseEther("1000");
      const transferAmount = ethers.parseEther("500");
      const remainingAllowance = approvedAmount - transferAmount;

      await erc20Token
        .connect(user1)
        .transferFrom(owner.address, user2.address, transferAmount);

      expect(
        await erc20Token.allowance(owner.address, user1.address)
      ).to.equal(remainingAllowance);
    });

    it("应该拒绝从零地址转账", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        erc20Token
          .connect(user1)
          .transferFrom(ethers.ZeroAddress, user2.address, amount)
      ).to.be.revertedWith("Transfer from the zero address");
    });

    it("应该拒绝转账到零地址", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        erc20Token
          .connect(user1)
          .transferFrom(owner.address, ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Transfer to the zero address");
    });

    it("应该拒绝余额不足的转账", async function () {
      // 授权一个很大的金额
      const largeAmount = ethers.parseEther("10000000");
      await erc20Token.connect(owner).approve(user1.address, largeAmount);

      // 但实际余额不足
      const ownerBalance = await erc20Token.balanceOf(owner.address);
      const excessiveAmount = ownerBalance + ethers.parseEther("1");

      await expect(
        erc20Token
          .connect(user1)
          .transferFrom(owner.address, user2.address, excessiveAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("应该拒绝授权不足的转账", async function () {
      // 先授权一个较小的金额
      const approvedAmount = ethers.parseEther("100");
      await erc20Token.connect(owner).approve(user1.address, approvedAmount);

      // 尝试转账超过授权金额
      const transferAmount = ethers.parseEther("200");

      await expect(
        erc20Token
          .connect(user1)
          .transferFrom(owner.address, user2.address, transferAmount)
      ).to.be.revertedWith("Insufficient allowance");
    });
  });

  describe("mint 功能", function () {
    it("应该允许所有者增发代币", async function () {
      const mintAmount = ethers.parseEther("10000");
      const totalSupplyBefore = await erc20Token.totalSupply();
      const user1BalanceBefore = await erc20Token.balanceOf(user1.address);

      await expect(erc20Token.connect(owner).mint(user1.address, mintAmount))
        .to.emit(erc20Token, "Mint")
        .withArgs(user1.address, mintAmount)
        .and.to.emit(erc20Token, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, mintAmount);

      expect(await erc20Token.totalSupply()).to.equal(
        totalSupplyBefore + mintAmount
      );
      expect(await erc20Token.balanceOf(user1.address)).to.equal(
        user1BalanceBefore + mintAmount
      );
    });

    it("应该拒绝非所有者调用 mint", async function () {
      const mintAmount = ethers.parseEther("10000");
      await expect(
        erc20Token.connect(user1).mint(user2.address, mintAmount)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("应该拒绝增发到零地址", async function () {
      const mintAmount = ethers.parseEther("10000");
      await expect(
        erc20Token.connect(owner).mint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("Mint to the zero address");
    });

    it("应该允许多次增发", async function () {
      const mintAmount1 = ethers.parseEther("1000");
      const mintAmount2 = ethers.parseEther("2000");

      await erc20Token.connect(owner).mint(user1.address, mintAmount1);
      await erc20Token.connect(owner).mint(user1.address, mintAmount2);

      const expectedBalance = mintAmount1 + mintAmount2;
      expect(await erc20Token.balanceOf(user1.address)).to.equal(
        expectedBalance
      );
    });
  });

  describe("边界情况", function () {
    it("应该处理零金额转账", async function () {
      await expect(
        erc20Token.connect(owner).transfer(user1.address, 0)
      ).to.emit(erc20Token, "Transfer").withArgs(owner.address, user1.address, 0);
    });

    it("应该处理零金额授权", async function () {
      await expect(
        erc20Token.connect(owner).approve(user1.address, 0)
      )
        .to.emit(erc20Token, "Approval")
        .withArgs(owner.address, user1.address, 0);
    });

    it("应该处理大金额转账", async function () {
      const largeAmount = ethers.parseEther("999999");
      await erc20Token.connect(owner).transfer(user1.address, largeAmount);
      expect(await erc20Token.balanceOf(user1.address)).to.equal(largeAmount);
    });

    it("应该正确处理完整的余额转账", async function () {
      const ownerBalance = await erc20Token.balanceOf(owner.address);
      await erc20Token.connect(owner).transfer(user1.address, ownerBalance);
      expect(await erc20Token.balanceOf(owner.address)).to.equal(0);
      expect(await erc20Token.balanceOf(user1.address)).to.equal(ownerBalance);
    });
  });

  describe("综合场景", function () {
    it("应该支持完整的转账流程", async function () {
      // 1. 初始转账
      const transferAmount = ethers.parseEther("1000");
      await erc20Token.connect(owner).transfer(user1.address, transferAmount);
      expect(await erc20Token.balanceOf(user1.address)).to.equal(transferAmount);

      // 2. 授权
      const approveAmount = ethers.parseEther("500");
      await erc20Token.connect(user1).approve(user2.address, approveAmount);
      expect(
        await erc20Token.allowance(user1.address, user2.address)
      ).to.equal(approveAmount);

      // 3. 从授权账户转账
      const transferFromAmount = ethers.parseEther("300");
      await erc20Token
        .connect(user2)
        .transferFrom(user1.address, user3.address, transferFromAmount);

      expect(await erc20Token.balanceOf(user3.address)).to.equal(
        transferFromAmount
      );
      expect(await erc20Token.balanceOf(user1.address)).to.equal(
        transferAmount - transferFromAmount
      );
      expect(
        await erc20Token.allowance(user1.address, user2.address)
      ).to.equal(approveAmount - transferFromAmount);
    });

    it("应该支持增发和转账的组合", async function () {
      // 增发给 user1
      const mintAmount = ethers.parseEther("5000");
      await erc20Token.connect(owner).mint(user1.address, mintAmount);
      expect(await erc20Token.balanceOf(user1.address)).to.equal(mintAmount);

      // user1 转账给 user2
      const transferAmount = ethers.parseEther("2000");
      await erc20Token.connect(user1).transfer(user2.address, transferAmount);

      expect(await erc20Token.balanceOf(user1.address)).to.equal(
        mintAmount - transferAmount
      );
      expect(await erc20Token.balanceOf(user2.address)).to.equal(transferAmount);
    });
  });
});

