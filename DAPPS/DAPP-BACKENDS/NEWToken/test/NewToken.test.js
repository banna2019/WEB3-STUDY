const { expect } = require("chai");
const { ethers } = require("hardhat");
require("dotenv").config();

describe("BlockInfoRecorderWithToken", function () {
  let token;
  let owner;
  let addr1;
  let addr2;
  
  // 从环境变量读取配置，如果没有则使用默认值
  const TOKEN_NAME = process.env.TOKEN_NAME || "NEW Token";
  const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL || "NTK";
  const TOKEN_DECIMALS = process.env.TOKEN_DECIMALS || "18";
  const TOKEN_INITIAL_SUPPLY_STR = process.env.TOKEN_INITIAL_SUPPLY || "100000000";
  // 将 TOKEN_DECIMALS 转换为数字，parseUnits 需要数字类型
  const TOKEN_DECIMALS_NUM = parseInt(TOKEN_DECIMALS, 10);
  const INITIAL_SUPPLY = ethers.parseUnits(TOKEN_INITIAL_SUPPLY_STR, TOKEN_DECIMALS_NUM);

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory("BlockInfoRecorderWithToken");
    // 将 TOKEN_DECIMALS 转换为数字
    const tokenDecimalsNum = parseInt(TOKEN_DECIMALS, 10);
    token = await Token.deploy(TOKEN_NAME, TOKEN_SYMBOL, tokenDecimalsNum, INITIAL_SUPPLY);
    await token.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置代币名称和符号", async function () {
      expect(await token.name()).to.equal(TOKEN_NAME);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("应该正确设置代币精度", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("应该将初始供应量铸造给部署者", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("应该正确设置总供应量", async function () {
      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.equal(INITIAL_SUPPLY);
    });

    it("应该正确设置合约所有者", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("ERC20 转账", function () {
    const transferAmount = ethers.parseEther("1000");

    it("应该能够转账代币", async function () {
      await token.transfer(addr1.address, transferAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("应该正确更新余额", async function () {
      const initialBalance = await token.balanceOf(owner.address);
      await token.transfer(addr1.address, transferAmount);
      
      expect(await token.balanceOf(owner.address)).to.equal(initialBalance - transferAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("应该发出 Transfer 事件", async function () {
      await expect(token.transfer(addr1.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("应该拒绝余额不足的转账", async function () {
      const largeAmount = ethers.parseEther("200000000");
      await expect(
        token.connect(addr1).transfer(addr2.address, largeAmount)
      ).to.be.reverted;
    });
  });

  describe("代币铸造", function () {
    const mintAmount = ethers.parseEther("50000");

    it("所有者应该能够铸造代币", async function () {
      await token.mint(addr1.address, mintAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("铸造应该增加总供应量", async function () {
      const initialSupply = await token.totalSupply();
      await token.mint(addr1.address, mintAmount);
      expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
    });

    it("非所有者不应该能够铸造代币", async function () {
      await expect(
        token.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("代币销毁", function () {
    const burnAmount = ethers.parseEther("10000");

    it("应该能够销毁自己的代币", async function () {
      await token.transfer(addr1.address, burnAmount);
      await token.connect(addr1).burn(burnAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it("销毁应该减少总供应量", async function () {
      const initialSupply = await token.totalSupply();
      await token.burn(burnAmount);
      expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
    });

    it("应该拒绝销毁超过余额的代币", async function () {
      await expect(
        token.connect(addr1).burn(burnAmount)
      ).to.be.reverted;
    });
  });

  describe("区块信息记录", function () {
    let blockNumber;
    let blockHash;
    let timestamp;
    let transactionCount;
    let miner;
    let gasLimit;
    let gasUsed;

    beforeEach(function () {
      blockNumber = 12345;
      blockHash = ethers.id("test-block-hash");
      timestamp = Math.floor(Date.now() / 1000);
      transactionCount = 10;
      miner = addr1.address;
      gasLimit = 30000000;
      gasUsed = 15000000;
    });

    it("应该能够记录区块信息", async function () {
      await token.recordBlockInfo(
        blockNumber,
        blockHash,
        timestamp,
        transactionCount,
        miner,
        gasLimit,
        gasUsed
      );

      const blockInfo = await token.getBlockInfo(blockNumber);
      expect(blockInfo.blockNumber).to.equal(blockNumber);
      expect(blockInfo.blockHash).to.equal(blockHash);
      expect(blockInfo.timestamp).to.equal(timestamp);
      expect(blockInfo.transactionCount).to.equal(transactionCount);
      expect(blockInfo.miner).to.equal(miner);
      expect(blockInfo.gasLimit).to.equal(gasLimit);
      expect(blockInfo.gasUsed).to.equal(gasUsed);
    });

    it("应该发出 BlockInfoRecorded 事件", async function () {
      await expect(
        token.recordBlockInfo(
          blockNumber,
          blockHash,
          timestamp,
          transactionCount,
          miner,
          gasLimit,
          gasUsed
        )
      )
        .to.emit(token, "BlockInfoRecorded")
        .withArgs(blockNumber, blockHash, timestamp, transactionCount);
    });

    it("应该增加已记录的区块数量", async function () {
      const initialCount = await token.getRecordedBlockCount();
      // 使用不同的区块号，避免与之前的测试用例冲突
      const newBlockNumber = blockNumber + 1000;
      await token.recordBlockInfo(
        newBlockNumber,
        blockHash,
        timestamp,
        transactionCount,
        miner,
        gasLimit,
        gasUsed
      );
      expect(await token.getRecordedBlockCount()).to.equal(Number(initialCount) + 1);
    });
  });

  describe("ETH 交易记录", function () {
    let txHash;
    let from;
    let to;
    let value;
    let blockNumber;
    let timestamp;
    let success;

    beforeEach(function () {
      txHash = ethers.id("test-eth-tx");
      from = owner.address;
      to = addr1.address;
      value = ethers.parseEther("1");
      blockNumber = 12346;
      timestamp = Math.floor(Date.now() / 1000);
      success = true;
    });

    it("应该能够记录 ETH 交易", async function () {
      await token.recordETHTransaction(
        txHash,
        from,
        to,
        value,
        blockNumber,
        timestamp,
        success
      );

      const txInfo = await token.getTransaction(txHash);
      expect(txInfo.txHash).to.equal(txHash);
      expect(txInfo.from).to.equal(from);
      expect(txInfo.to).to.equal(to);
      expect(txInfo.value).to.equal(value);
      expect(txInfo.blockNumber).to.equal(blockNumber);
      expect(txInfo.timestamp).to.equal(timestamp);
      expect(txInfo.success).to.equal(success);
      expect(txInfo.isTokenTransfer).to.equal(false);
    });

    it("应该发出 ETHTransactionRecorded 事件", async function () {
      await expect(
        token.recordETHTransaction(
          txHash,
          from,
          to,
          value,
          blockNumber,
          timestamp,
          success
        )
      )
        .to.emit(token, "ETHTransactionRecorded")
        .withArgs(txHash, from, to, value);
    });
  });

  describe("代币转账记录", function () {
    let txHash;
    let from;
    let to;
    let amount;
    let blockNumber;
    let timestamp;
    let success;

    beforeEach(function () {
      txHash = ethers.id("test-token-tx");
      from = owner.address;
      to = addr1.address;
      amount = ethers.parseEther("1000");
      blockNumber = 12347;
      timestamp = Math.floor(Date.now() / 1000);
      success = true;
    });

    it("应该能够记录代币转账", async function () {
      await token.recordTokenTransfer(
        txHash,
        from,
        to,
        amount,
        blockNumber,
        timestamp,
        success
      );

      const txInfo = await token.getTransaction(txHash);
      expect(txInfo.txHash).to.equal(txHash);
      expect(txInfo.from).to.equal(from);
      expect(txInfo.to).to.equal(to);
      expect(txInfo.value).to.equal(amount);
      expect(txInfo.blockNumber).to.equal(blockNumber);
      expect(txInfo.timestamp).to.equal(timestamp);
      expect(txInfo.success).to.equal(success);
      expect(txInfo.isTokenTransfer).to.equal(true);
    });

    it("应该发出 TokenTransferRecorded 事件", async function () {
      await expect(
        token.recordTokenTransfer(
          txHash,
          from,
          to,
          amount,
          blockNumber,
          timestamp,
          success
        )
      )
        .to.emit(token, "TokenTransferRecorded")
        .withArgs(txHash, from, to, amount);
    });
  });

  describe("查询功能", function () {
    it("应该能够查询代币余额", async function () {
      const balance = await token.getTokenBalance(owner.address);
      expect(balance).to.equal(INITIAL_SUPPLY);
    });

    it("应该能够查询总供应量", async function () {
      const totalSupply = await token.getTotalSupply();
      expect(totalSupply).to.equal(INITIAL_SUPPLY);
    });

    it("应该能够查询 ETH 余额", async function () {
      const ethBalance = await token.getETHBalance();
      expect(ethBalance).to.equal(0);
    });
  });

  describe("ETH 接收和提取", function () {
    it("应该能够接收 ETH", async function () {
      const sendAmount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await token.getAddress(),
        value: sendAmount,
      });
      
      const contractBalance = await token.getETHBalance();
      expect(contractBalance).to.equal(sendAmount);
    });

    it("所有者应该能够提取 ETH", async function () {
      const sendAmount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await token.getAddress(),
        value: sendAmount,
      });

      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const withdrawTx = await token.withdraw();
      const receipt = await withdrawTx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

      expect(finalOwnerBalance).to.equal(initialOwnerBalance + sendAmount - gasUsed);
      expect(await token.getETHBalance()).to.equal(0);
    });

    it("非所有者不应该能够提取 ETH", async function () {
      await owner.sendTransaction({
        to: await token.getAddress(),
        value: ethers.parseEther("1"),
      });

      await expect(
        token.connect(addr1).withdraw()
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });
});

