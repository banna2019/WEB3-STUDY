const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuctionFactory", function () {
  let auctionFactory;
  let priceOracle;
  let owner;
  let user1;
  let user2;

  const SEPOLIA_ETH_USD_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  const feeRate = 250; // 2.5%
  const feeRecipient = ethers.Wallet.createRandom().address;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 部署价格预言机
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.deploy(SEPOLIA_ETH_USD_FEED);
    await priceOracle.waitForDeployment();

    // 部署工厂合约
    const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    auctionFactory = await AuctionFactory.deploy();
    await auctionFactory.waitForDeployment();
  });

  describe("部署", function () {
    it("初始拍卖数量应该为 0", async function () {
      expect(await auctionFactory.getAuctionsCount()).to.equal(0);
    });
  });

  describe("创建拍卖", function () {
    it("应该能够创建新的拍卖合约", async function () {
      await expect(
        auctionFactory
          .connect(user1)
          .createAuction(
            await priceOracle.getAddress(),
            feeRate,
            feeRecipient
          )
      )
        .to.emit(auctionFactory, "AuctionCreated")
        .withArgs((auctionAddress) => auctionAddress !== ethers.ZeroAddress, user1.address, 0);

      expect(await auctionFactory.getAuctionsCount()).to.equal(1);
    });

    it("应该能够创建多个拍卖合约", async function () {
      await auctionFactory
        .connect(user1)
        .createAuction(await priceOracle.getAddress(), feeRate, feeRecipient);
      await auctionFactory
        .connect(user2)
        .createAuction(await priceOracle.getAddress(), feeRate, feeRecipient);

      expect(await auctionFactory.getAuctionsCount()).to.equal(2);
    });

    it("应该记录用户创建的拍卖", async function () {
      await auctionFactory
        .connect(user1)
        .createAuction(await priceOracle.getAddress(), feeRate, feeRecipient);
      await auctionFactory
        .connect(user1)
        .createAuction(await priceOracle.getAddress(), feeRate, feeRecipient);

      const userAuctions = await auctionFactory.getUserAuctions(user1.address);
      expect(userAuctions.length).to.equal(2);
      expect(await auctionFactory.getUserAuctionsCount(user1.address)).to.equal(2);
    });
  });

  describe("查询拍卖", function () {
    let auctionAddress1;
    let auctionAddress2;

    beforeEach(async function () {
      const tx1 = await auctionFactory
        .connect(user1)
        .createAuction(await priceOracle.getAddress(), feeRate, feeRecipient);
      await tx1.wait();
      auctionAddress1 = await auctionFactory.getAuction(0);

      const tx2 = await auctionFactory
        .connect(user2)
        .createAuction(await priceOracle.getAddress(), feeRate, feeRecipient);
      await tx2.wait();
      auctionAddress2 = await auctionFactory.getAuction(1);
    });

    it("应该能够通过索引获取拍卖地址", async function () {
      expect(await auctionFactory.getAuction(0)).to.equal(auctionAddress1);
      expect(await auctionFactory.getAuction(1)).to.equal(auctionAddress2);
    });

    it("不应该允许访问超出范围的索引", async function () {
      await expect(auctionFactory.getAuction(2)).to.be.revertedWith("Index out of bounds");
    });

    it("应该能够获取用户创建的所有拍卖", async function () {
      const user1Auctions = await auctionFactory.getUserAuctions(user1.address);
      expect(user1Auctions.length).to.equal(1);
      expect(user1Auctions[0]).to.equal(auctionAddress1);

      const user2Auctions = await auctionFactory.getUserAuctions(user2.address);
      expect(user2Auctions.length).to.equal(1);
      expect(user2Auctions[0]).to.equal(auctionAddress2);
    });
  });
});

