const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
  let myNFT;
  let owner;
  let user1;
  let user2;
  let user3;

  const nftName = "Test NFT Collection";
  const nftSymbol = "TNFT";
  const baseTokenURI = "ipfs://QmYourHashHere";
  const tokenURI1 = "ipfs://QmHash1";
  const tokenURI2 = "ipfs://QmHash2";
  const tokenURI3 = "ipfs://QmHash3";

  beforeEach(async function () {
    // 获取签名者
    [owner, user1, user2, user3] = await ethers.getSigners();

    // 部署合约
    const MyNFT = await ethers.getContractFactory("MyNFT");
    myNFT = await MyNFT.deploy(nftName, nftSymbol);
    await myNFT.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置 NFT 名称", async function () {
      expect(await myNFT.name()).to.equal(nftName);
    });

    it("应该正确设置 NFT 符号", async function () {
      expect(await myNFT.symbol()).to.equal(nftSymbol);
    });

    it("应该正确设置合约所有者", async function () {
      expect(await myNFT.owner()).to.equal(owner.address);
    });

    it("初始总供应量应该为 0", async function () {
      expect(await myNFT.totalSupply()).to.equal(0);
    });

    it("当前 token ID 应该从 1 开始", async function () {
      expect(await myNFT.currentTokenId()).to.equal(1);
    });
  });

  describe("mintNFT 功能", function () {
    it("应该允许铸造 NFT", async function () {
      await expect(myNFT.connect(owner).mintNFT(user1.address, tokenURI1))
        .to.emit(myNFT, "NFTMinted")
        .withArgs(user1.address, 1, tokenURI1);

      expect(await myNFT.ownerOf(1)).to.equal(user1.address);
      expect(await myNFT.tokenURI(1)).to.equal(tokenURI1);
      expect(await myNFT.balanceOf(user1.address)).to.equal(1);
    });

    it("应该正确更新总供应量", async function () {
      await myNFT.connect(owner).mintNFT(user1.address, tokenURI1);
      expect(await myNFT.totalSupply()).to.equal(1);

      await myNFT.connect(owner).mintNFT(user2.address, tokenURI2);
      expect(await myNFT.totalSupply()).to.equal(2);
    });

    it("应该正确递增 token ID", async function () {
      const tokenId1 = await myNFT.connect(owner).mintNFT(user1.address, tokenURI1);
      await expect(tokenId1).to.emit(myNFT, "NFTMinted").withArgs(user1.address, 1, tokenURI1);

      const tokenId2 = await myNFT.connect(owner).mintNFT(user2.address, tokenURI2);
      await expect(tokenId2).to.emit(myNFT, "NFTMinted").withArgs(user2.address, 2, tokenURI2);

      expect(await myNFT.currentTokenId()).to.equal(3);
    });

    it("应该拒绝铸造到零地址", async function () {
      await expect(
        myNFT.connect(owner).mintNFT(ethers.ZeroAddress, tokenURI1)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("应该拒绝空的 token URI", async function () {
      await expect(
        myNFT.connect(owner).mintNFT(user1.address, "")
      ).to.be.revertedWith("Token URI cannot be empty");
    });

    it("应该允许任何人铸造 NFT", async function () {
      await myNFT.connect(user1).mintNFT(user2.address, tokenURI1);
      expect(await myNFT.ownerOf(1)).to.equal(user2.address);
    });

    it("应该允许铸造多个 NFT 到同一地址", async function () {
      await myNFT.connect(owner).mintNFT(user1.address, tokenURI1);
      await myNFT.connect(owner).mintNFT(user1.address, tokenURI2);
      await myNFT.connect(owner).mintNFT(user1.address, tokenURI3);

      expect(await myNFT.balanceOf(user1.address)).to.equal(3);
      expect(await myNFT.ownerOf(1)).to.equal(user1.address);
      expect(await myNFT.ownerOf(2)).to.equal(user1.address);
      expect(await myNFT.ownerOf(3)).to.equal(user1.address);
    });

    it("应该返回正确的 token ID", async function () {
      const tx = await myNFT.connect(owner).mintNFT(user1.address, tokenURI1);
      const receipt = await tx.wait();
      const mintEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "NFTMinted"
      );
      expect(mintEvent.args.tokenId).to.equal(1);
    });
  });

  describe("batchMintNFT 功能", function () {
    it("应该允许所有者批量铸造 NFT", async function () {
      const tokenURIs = [tokenURI1, tokenURI2, tokenURI3];
      const tx = await myNFT.connect(owner).batchMintNFT(user1.address, tokenURIs);

      await expect(tx).to.emit(myNFT, "NFTMinted").withArgs(user1.address, 1, tokenURI1);
      await expect(tx).to.emit(myNFT, "NFTMinted").withArgs(user1.address, 2, tokenURI2);
      await expect(tx).to.emit(myNFT, "NFTMinted").withArgs(user1.address, 3, tokenURI3);

      expect(await myNFT.balanceOf(user1.address)).to.equal(3);
      expect(await myNFT.totalSupply()).to.equal(3);
    });

    it("应该拒绝非所有者调用批量铸造", async function () {
      const tokenURIs = [tokenURI1, tokenURI2];
      await expect(
        myNFT.connect(user1).batchMintNFT(user2.address, tokenURIs)
      ).to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
    });

    it("应该拒绝批量铸造到零地址", async function () {
      const tokenURIs = [tokenURI1];
      await expect(
        myNFT.connect(owner).batchMintNFT(ethers.ZeroAddress, tokenURIs)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("应该拒绝空的 token URIs 数组", async function () {
      const tokenURIs = [];
      await expect(
        myNFT.connect(owner).batchMintNFT(user1.address, tokenURIs)
      ).to.be.revertedWith("Token URIs array cannot be empty");
    });

    it("应该拒绝包含空 token URI 的数组", async function () {
      const tokenURIs = [tokenURI1, "", tokenURI2];
      await expect(
        myNFT.connect(owner).batchMintNFT(user1.address, tokenURIs)
      ).to.be.revertedWith("Token URI cannot be empty");
    });

    it("应该正确返回批量铸造的 token IDs", async function () {
      const tokenURIs = [tokenURI1, tokenURI2];
      const result = await myNFT.connect(owner).batchMintNFT(user1.address, tokenURIs);
      const receipt = await result.wait();
      
      // 检查返回的 token IDs
      expect(await myNFT.ownerOf(1)).to.equal(user1.address);
      expect(await myNFT.ownerOf(2)).to.equal(user1.address);
    });
  });

  describe("tokenURI 功能", function () {
    beforeEach(async function () {
      await myNFT.connect(owner).mintNFT(user1.address, tokenURI1);
    });

    it("应该正确返回 token URI", async function () {
      expect(await myNFT.tokenURI(1)).to.equal(tokenURI1);
    });

    it("应该拒绝查询不存在的 token URI", async function () {
      await expect(myNFT.tokenURI(999)).to.be.reverted;
    });
  });

  describe("ERC721 标准功能", function () {
    beforeEach(async function () {
      await myNFT.connect(owner).mintNFT(user1.address, tokenURI1);
      await myNFT.connect(owner).mintNFT(user2.address, tokenURI2);
    });

    it("应该正确返回 ownerOf", async function () {
      expect(await myNFT.ownerOf(1)).to.equal(user1.address);
      expect(await myNFT.ownerOf(2)).to.equal(user2.address);
    });

    it("应该正确返回 balanceOf", async function () {
      expect(await myNFT.balanceOf(user1.address)).to.equal(1);
      expect(await myNFT.balanceOf(user2.address)).to.equal(1);

      await myNFT.connect(owner).mintNFT(user1.address, tokenURI3);
      expect(await myNFT.balanceOf(user1.address)).to.equal(2);
    });

    it("应该支持 transferFrom", async function () {
      await myNFT.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await myNFT.ownerOf(1)).to.equal(user2.address);
      expect(await myNFT.balanceOf(user1.address)).to.equal(0);
      expect(await myNFT.balanceOf(user2.address)).to.equal(2);
    });

    it("应该支持 approve 和 transferFrom", async function () {
      await myNFT.connect(user1).approve(user3.address, 1);
      await myNFT.connect(user3).transferFrom(user1.address, user3.address, 1);
      expect(await myNFT.ownerOf(1)).to.equal(user3.address);
    });

    it("应该支持 safeTransferFrom", async function () {
      await myNFT.connect(user1)["safeTransferFrom(address,address,uint256)"](
        user1.address,
        user2.address,
        1
      );
      expect(await myNFT.ownerOf(1)).to.equal(user2.address);
    });
  });

  describe("边界情况", function () {
    it("应该处理大量铸造", async function () {
      const count = 10;
      for (let i = 0; i < count; i++) {
        await myNFT.connect(owner).mintNFT(user1.address, `${tokenURI1}${i}`);
      }
      expect(await myNFT.totalSupply()).to.equal(count);
      expect(await myNFT.balanceOf(user1.address)).to.equal(count);
    });

    it("应该正确处理不同的 token URI 格式", async function () {
      const uris = [
        "ipfs://QmHash1",
        "https://example.com/metadata/1.json",
        "ar://hash123",
        "https://api.example.com/token/1"
      ];

      for (let i = 0; i < uris.length; i++) {
        await myNFT.connect(owner).mintNFT(user1.address, uris[i]);
        expect(await myNFT.tokenURI(i + 1)).to.equal(uris[i]);
      }
    });
  });

  describe("综合场景", function () {
    it("应该支持完整的 NFT 生命周期", async function () {
      // 1. 铸造 NFT
      await myNFT.connect(owner).mintNFT(user1.address, tokenURI1);
      expect(await myNFT.ownerOf(1)).to.equal(user1.address);

      // 2. 查询元数据
      expect(await myNFT.tokenURI(1)).to.equal(tokenURI1);

      // 3. 转移 NFT
      await myNFT.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await myNFT.ownerOf(1)).to.equal(user2.address);

      // 4. 批量铸造
      const tokenURIs = [tokenURI2, tokenURI3];
      await myNFT.connect(owner).batchMintNFT(user3.address, tokenURIs);
      expect(await myNFT.balanceOf(user3.address)).to.equal(2);

      // 5. 验证总供应量
      expect(await myNFT.totalSupply()).to.equal(3);
    });
  });
});

