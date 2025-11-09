const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction", function () {
  let auctionNFT;
  let priceOracle;
  let auction;
  let owner;
  let seller;
  let bidder1;
  let bidder2;
  let feeRecipient;

  const nftName = "Test NFT Collection";
  const nftSymbol = "TNFT";
  const tokenURI = "ipfs://QmHash1";
  const feeRate = 250; // 2.5%
  const duration = 3600; // 1 小时
  const reservePrice = ethers.parseEther("0.1"); // 0.1 ETH

  beforeEach(async function () {
    [owner, seller, bidder1, bidder2, feeRecipient] = await ethers.getSigners();

    // 部署 NFT 合约
    const AuctionNFT = await ethers.getContractFactory("AuctionNFT");
    auctionNFT = await AuctionNFT.deploy(nftName, nftSymbol);
    await auctionNFT.waitForDeployment();

    // 部署 Mock 价格源（模拟 ETH/USD 价格为 $3000，精度为 8）
    const MockAggregatorV3 = await ethers.getContractFactory("MockAggregatorV3");
    const mockPriceFeed = await MockAggregatorV3.deploy(3000 * 10 ** 8, 8);
    await mockPriceFeed.waitForDeployment();

    // 部署价格预言机，使用 Mock 价格源
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.deploy(await mockPriceFeed.getAddress());
    await priceOracle.waitForDeployment();

    // 部署拍卖合约
    const Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.deploy(
      await priceOracle.getAddress(),
      feeRate,
      feeRecipient.address
    );
    await auction.waitForDeployment();

    // 铸造 NFT 给卖家
    await auctionNFT.mint(seller.address, tokenURI);
  });

  describe("创建拍卖", function () {
    it("应该能够创建拍卖", async function () {
      await auctionNFT.connect(seller).approve(await auction.getAddress(), 1);

      await expect(
        auction
          .connect(seller)
          .createAuction(
            await auctionNFT.getAddress(),
            1,
            duration,
            reservePrice,
            ethers.ZeroAddress
          )
      )
        .to.emit(auction, "AuctionCreated")
        .withArgs(
          0,
          seller.address,
          await auctionNFT.getAddress(),
          1,
          (value) => value > 0,
          (value) => value > 0,
          reservePrice
        );

      const auctionInfo = await auction.getAuctionInfo(0);
      expect(auctionInfo[0]).to.equal(seller.address); // seller
      expect(auctionInfo[1]).to.equal(await auctionNFT.getAddress()); // nftContract
      expect(auctionInfo[2]).to.equal(1); // tokenId
    });

    it("不应该允许非 NFT 所有者创建拍卖", async function () {
      await expect(
        auction
          .connect(bidder1)
          .createAuction(
            await auctionNFT.getAddress(),
            1,
            duration,
            reservePrice,
            ethers.ZeroAddress
          )
      ).to.be.revertedWith("Not NFT owner");
    });

    it("不应该允许使用零地址 NFT 合约创建拍卖", async function () {
      await expect(
        auction
          .connect(seller)
          .createAuction(
            ethers.ZeroAddress,
            1,
            duration,
            reservePrice,
            ethers.ZeroAddress
          )
      ).to.be.revertedWith("Invalid NFT contract");
    });
  });

  describe("出价", function () {
    let auctionId;

    beforeEach(async function () {
      await auctionNFT.connect(seller).approve(await auction.getAddress(), 1);
      const tx = await auction
        .connect(seller)
        .createAuction(
          await auctionNFT.getAddress(),
          1,
          duration,
          reservePrice,
          ethers.ZeroAddress
        );
      await tx.wait();
      auctionId = 0;
    });

    it("应该能够使用 ETH 出价", async function () {
      const bidAmount = ethers.parseEther("0.2");
      await expect(
        auction.connect(bidder1).bidWithETH(auctionId, { value: bidAmount })
      )
        .to.emit(auction, "BidPlaced")
        .withArgs(
          auctionId,
          bidder1.address,
          bidAmount,
          ethers.ZeroAddress,
          (value) => value > 0
        );
    });

    it("不应该允许低于底价的出价", async function () {
      const bidAmount = ethers.parseEther("0.05"); // 低于 0.1 ETH 底价
      await expect(
        auction.connect(bidder1).bidWithETH(auctionId, { value: bidAmount })
      ).to.be.revertedWith("Bid below reserve price");
    });

    it("不应该允许低于当前最高出价的出价", async function () {
      const bidAmount1 = ethers.parseEther("0.2");
      await auction.connect(bidder1).bidWithETH(auctionId, { value: bidAmount1 });

      const bidAmount2 = ethers.parseEther("0.15");
      await expect(
        auction.connect(bidder2).bidWithETH(auctionId, { value: bidAmount2 })
      ).to.be.revertedWith("Bid must be higher than current highest bid");
    });

    it("应该退还之前的出价", async function () {
      const bidAmount1 = ethers.parseEther("0.2");
      const bidAmount2 = ethers.parseEther("0.3");

      const balanceBefore = await ethers.provider.getBalance(bidder1.address);
      await auction.connect(bidder1).bidWithETH(auctionId, { value: bidAmount1 });
      await auction.connect(bidder2).bidWithETH(auctionId, { value: bidAmount2 });

      // 等待退款
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const balanceAfter = await ethers.provider.getBalance(bidder1.address);
      // bidder1 应该收到退款（减去 gas 费用）
      expect(balanceAfter).to.be.gte(balanceBefore - bidAmount1);
    });
  });

  describe("结束拍卖", function () {
    let auctionId;

    beforeEach(async function () {
      await auctionNFT.connect(seller).approve(await auction.getAddress(), 1);
      const tx = await auction
        .connect(seller)
        .createAuction(
          await auctionNFT.getAddress(),
          1,
          duration,
          reservePrice,
          ethers.ZeroAddress
        );
      await tx.wait();
      auctionId = 0;
    });

    it("应该能够结束拍卖并转移 NFT", async function () {
      const bidAmount = ethers.parseEther("0.2");
      await auction.connect(bidder1).bidWithETH(auctionId, { value: bidAmount });

      // 增加时间以结束拍卖
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(auction.endAuction(auctionId))
        .to.emit(auction, "AuctionEnded")
        .withArgs(auctionId, bidder1.address, bidAmount, ethers.ZeroAddress);

      expect(await auctionNFT.ownerOf(1)).to.equal(bidder1.address);
    });

    it("应该将资金转移给卖家和手续费接收者", async function () {
      const bidAmount = ethers.parseEther("1.0");
      await auction.connect(bidder1).bidWithETH(auctionId, { value: bidAmount });

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(
        feeRecipient.address
      );

      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine", []);
      await auction.endAuction(auctionId);

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(
        feeRecipient.address
      );

      const expectedFee = (bidAmount * BigInt(feeRate)) / 10000n;
      const expectedSellerAmount = bidAmount - expectedFee;

      expect(sellerBalanceAfter - sellerBalanceBefore).to.be.gte(expectedSellerAmount);
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.be.gte(expectedFee);
    });

    it("如果没有出价，应该退还 NFT 给卖家", async function () {
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine", []);
      await auction.endAuction(auctionId);

      expect(await auctionNFT.ownerOf(1)).to.equal(seller.address);
    });
  });

  describe("取消拍卖", function () {
    let auctionId;

    beforeEach(async function () {
      await auctionNFT.connect(seller).approve(await auction.getAddress(), 1);
      const tx = await auction
        .connect(seller)
        .createAuction(
          await auctionNFT.getAddress(),
          1,
          duration,
          reservePrice,
          ethers.ZeroAddress
        );
      await tx.wait();
      auctionId = 0;
    });

    it("卖家应该能够取消拍卖", async function () {
      await expect(auction.connect(seller).cancelAuction(auctionId))
        .to.emit(auction, "AuctionCancelled")
        .withArgs(auctionId);

      expect(await auctionNFT.ownerOf(1)).to.equal(seller.address);
    });

    it("不应该允许非卖家取消拍卖", async function () {
      await expect(
        auction.connect(bidder1).cancelAuction(auctionId)
      ).to.be.revertedWith("Not seller");
    });

    it("不应该允许在有出价后取消拍卖", async function () {
      const bidAmount = ethers.parseEther("0.2");
      await auction.connect(bidder1).bidWithETH(auctionId, { value: bidAmount });

      await expect(
        auction.connect(seller).cancelAuction(auctionId)
      ).to.be.revertedWith("Cannot cancel with bids");
    });
  });
});

