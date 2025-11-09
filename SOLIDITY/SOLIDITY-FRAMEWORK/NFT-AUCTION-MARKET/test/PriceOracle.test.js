const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceOracle", function () {
  let priceOracle;
  let mockPriceFeed;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // 部署 Mock 价格源（模拟 ETH/USD 价格为 $3000，精度为 8）
    const MockAggregatorV3 = await ethers.getContractFactory("MockAggregatorV3");
    mockPriceFeed = await MockAggregatorV3.deploy(3000 * 10 ** 8, 8);
    await mockPriceFeed.waitForDeployment();

    // 部署价格预言机，使用 Mock 价格源
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.deploy(await mockPriceFeed.getAddress());
    await priceOracle.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置 ETH/USD 价格源", async function () {
      // 验证价格源地址已设置（通过尝试获取价格来验证）
      const [price, decimals] = await priceOracle.getETHPrice();
      expect(price).to.be.gt(0);
      expect(decimals).to.equal(8);
    });

    it("不应该使用零地址初始化", async function () {
      const PriceOracle = await ethers.getContractFactory("PriceOracle");
      await expect(
        PriceOracle.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid price feed address");
    });
  });

  describe("价格查询", function () {
    it("应该能够获取 ETH/USD 价格", async function () {
      const [price, decimals] = await priceOracle.getETHPrice();
      expect(price).to.be.gt(0);
      expect(decimals).to.equal(8);
    });

    it("应该能够将 ETH 金额转换为 USD", async function () {
      const ethAmount = ethers.parseEther("1"); // 1 ETH
      const usdAmount = await priceOracle.convertETHToUSD(ethAmount);
      expect(usdAmount).to.be.gt(0);
    });

    it("应该能够设置 ERC20 价格源", async function () {
      // 使用一个测试地址作为 ERC20 代币
      const testToken = ethers.Wallet.createRandom().address;
      // 部署另一个 Mock 价格源用于 ERC20
      const MockAggregatorV3 = await ethers.getContractFactory("MockAggregatorV3");
      const erc20PriceFeed = await MockAggregatorV3.deploy(1 * 10 ** 8, 8); // $1
      await erc20PriceFeed.waitForDeployment();
      
      await expect(priceOracle.setERC20PriceFeed(testToken, await erc20PriceFeed.getAddress()))
        .to.emit(priceOracle, "PriceFeedUpdated")
        .withArgs(testToken, await erc20PriceFeed.getAddress());
    });

    it("不应该能够使用零地址设置价格源", async function () {
      const testToken = ethers.Wallet.createRandom().address;
      await expect(
        priceOracle.setERC20PriceFeed(testToken, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid price feed address");
    });
  });

  describe("价格比较", function () {
    it("应该能够比较 ETH 和 ERC20 出价", async function () {
      const ethBid = ethers.parseEther("1"); // 1 ETH
      const testToken = ethers.ZeroAddress; // 不使用 ERC20
      const tokenBid = 0;
      const tokenDecimals = 18;

      const [isETHHigher, higherBidUSD] = await priceOracle.compareBids(
        ethBid,
        testToken,
        tokenBid,
        tokenDecimals
      );

      expect(isETHHigher).to.be.true;
      expect(higherBidUSD).to.be.gt(0);
    });
  });
});

