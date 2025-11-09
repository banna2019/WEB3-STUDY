const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuctionNFT", function () {
  let auctionNFT;
  let owner;
  let user1;
  let user2;

  const nftName = "Test NFT Collection";
  const nftSymbol = "TNFT";
  const tokenURI1 = "ipfs://QmHash1";
  const tokenURI2 = "ipfs://QmHash2";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AuctionNFT = await ethers.getContractFactory("AuctionNFT");
    auctionNFT = await AuctionNFT.deploy(nftName, nftSymbol);
    await auctionNFT.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置 NFT 名称和符号", async function () {
      expect(await auctionNFT.name()).to.equal(nftName);
      expect(await auctionNFT.symbol()).to.equal(nftSymbol);
    });

    it("应该将部署者设置为所有者", async function () {
      expect(await auctionNFT.owner()).to.equal(owner.address);
    });

    it("初始总供应量应该为 0", async function () {
      expect(await auctionNFT.totalSupply()).to.equal(0);
    });
  });

  describe("铸造 NFT", function () {
    it("所有者应该能够铸造 NFT", async function () {
      await expect(auctionNFT.mint(user1.address, tokenURI1))
        .to.emit(auctionNFT, "NFTMinted")
        .withArgs(user1.address, 1, tokenURI1);

      expect(await auctionNFT.ownerOf(1)).to.equal(user1.address);
      expect(await auctionNFT.tokenURI(1)).to.equal(tokenURI1);
      expect(await auctionNFT.totalSupply()).to.equal(1);
    });

    it("非所有者不应该能够铸造 NFT", async function () {
      await expect(
        auctionNFT.connect(user1).mint(user1.address, tokenURI1)
      ).to.be.revertedWithCustomError(auctionNFT, "OwnableUnauthorizedAccount");
    });

    it("不应该能够铸造到零地址", async function () {
      await expect(
        auctionNFT.mint(ethers.ZeroAddress, tokenURI1)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("不应该能够使用空 URI 铸造", async function () {
      await expect(
        auctionNFT.mint(user1.address, "")
      ).to.be.revertedWith("Token URI cannot be empty");
    });

    it("应该能够批量铸造 NFT", async function () {
      const uris = [tokenURI1, tokenURI2];
      const tx = await auctionNFT.batchMint(user1.address, uris);
      await tx.wait();

      expect(await auctionNFT.ownerOf(1)).to.equal(user1.address);
      expect(await auctionNFT.ownerOf(2)).to.equal(user1.address);
      expect(await auctionNFT.tokenURI(1)).to.equal(tokenURI1);
      expect(await auctionNFT.tokenURI(2)).to.equal(tokenURI2);
      expect(await auctionNFT.totalSupply()).to.equal(2);
    });
  });

  describe("转移 NFT", function () {
    beforeEach(async function () {
      await auctionNFT.mint(owner.address, tokenURI1);
    });

    it("应该能够转移 NFT", async function () {
      await auctionNFT.transferFrom(owner.address, user1.address, 1);
      expect(await auctionNFT.ownerOf(1)).to.equal(user1.address);
    });

    it("应该能够安全转移 NFT", async function () {
      await auctionNFT["safeTransferFrom(address,address,uint256)"](
        owner.address,
        user1.address,
        1
      );
      expect(await auctionNFT.ownerOf(1)).to.equal(user1.address);
    });
  });
});

