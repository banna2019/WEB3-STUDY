const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MetaStake Uniswap Integration", function () {
  let metaNodeToken;
  let metaStake;
  let mockUniswapRouter;
  let mockWETH;
  let mockOutputToken;
  let owner;
  let admin;
  let user1;

  const META_NODE_PER_BLOCK = ethers.parseEther("1");
  const MIN_DEPOSIT = ethers.parseEther("0.1");
  const UNSTAKE_LOCKED_BLOCKS = 100;

  beforeEach(async function () {
    [owner, admin, user1] = await ethers.getSigners();

    // 部署MetaNode代币
    const MetaNodeToken = await ethers.getContractFactory("MetaNodeToken");
    metaNodeToken = await MetaNodeToken.deploy(owner.address);

    // 部署MetaStake合约
    const MetaStake = await ethers.getContractFactory("MetaStake");
    const startBlock = await ethers.provider.getBlockNumber();
    metaStake = await upgrades.deployProxy(
      MetaStake,
      [
        await metaNodeToken.getAddress(),
        META_NODE_PER_BLOCK,
        startBlock,
        admin.address,
      ],
      { initializer: "initialize" }
    );
    await metaStake.waitForDeployment();

    // 给MetaStake合约铸造奖励代币
    await metaNodeToken.mint(await metaStake.getAddress(), ethers.parseEther("1000000"));

    // 部署Mock WETH
    const MockWETH = await ethers.getContractFactory("MetaNodeToken");
    mockWETH = await MockWETH.deploy(owner.address);
    await mockWETH.mint(owner.address, ethers.parseEther("1000000"));

    // 部署Mock输出代币
    const MockToken = await ethers.getContractFactory("MetaNodeToken");
    mockOutputToken = await MockToken.deploy(owner.address);
    await mockOutputToken.mint(owner.address, ethers.parseEther("1000000"));

    // 部署Mock Uniswap Router
    const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
    mockUniswapRouter = await MockUniswapRouter.deploy(await mockWETH.getAddress());
    await mockUniswapRouter.waitForDeployment();

    // 设置Uniswap Router
    await metaStake.connect(admin).setUniswapRouter(await mockUniswapRouter.getAddress());

    // 添加质押池
    await metaStake.connect(admin).addPool(
      ethers.ZeroAddress,
      ethers.parseEther("1"),
      MIN_DEPOSIT,
      UNSTAKE_LOCKED_BLOCKS
    );

    // 给Mock Router转账足够的ETH和代币用于交换
    // 使用较小的数量以避免余额不足
    await owner.sendTransaction({
      to: await mockUniswapRouter.getAddress(),
      value: ethers.parseEther("100") // 给Router足够的ETH（减少数量）
    });
    
    // 给Router转账足够的输出代币
    await mockOutputToken.mint(await mockUniswapRouter.getAddress(), ethers.parseEther("1000000"));
    await mockWETH.mint(await mockUniswapRouter.getAddress(), ethers.parseEther("1000000"));

    // 设置Mock Router的交换比例（1 MetaNode = 0.1 ETH = 100 OutputToken）
    await mockUniswapRouter.setSwapRate(
      await metaNodeToken.getAddress(),
      await mockWETH.getAddress(),
      ethers.parseEther("0.1") // 1 MetaNode = 0.1 WETH
    );
    await mockUniswapRouter.setSwapRate(
      await mockWETH.getAddress(),
      await mockOutputToken.getAddress(),
      ethers.parseEther("1000") // 1 WETH = 1000 OutputToken
    );
  });

  describe("Uniswap Router配置", function () {
    it("管理员应该能够设置Uniswap Router", async function () {
      const newRouter = await ethers.deployContract("MockUniswapRouter", [await mockWETH.getAddress()]);
      
      await expect(
        metaStake.connect(admin).setUniswapRouter(await newRouter.getAddress())
      )
        .to.emit(metaStake, "UniswapRouterSet")
        .withArgs(await mockUniswapRouter.getAddress(), await newRouter.getAddress());

      expect(await metaStake.uniswapRouter()).to.equal(await newRouter.getAddress());
    });

    it("非管理员不应该能够设置Uniswap Router", async function () {
      const newRouter = await ethers.deployContract("MockUniswapRouter", [await mockWETH.getAddress()]);
      
      await expect(
        metaStake.connect(user1).setUniswapRouter(await newRouter.getAddress())
      ).to.be.revertedWithCustomError(metaStake, "AccessControlUnauthorizedAccount");
    });

    it("不应该允许设置零地址", async function () {
      await expect(
        metaStake.connect(admin).setUniswapRouter(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid router address");
    });
  });

  describe("领取并交换奖励（交换成ETH）", function () {
    beforeEach(async function () {
      // 用户质押
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 挖区块产生奖励
      for (let i = 0; i < 10; i++) {
        await time.advanceBlock();
      }
    });

    it("用户应该能够领取奖励并自动交换成ETH", async function () {
      const pendingBefore = await metaStake.pendingReward(0, user1.address);
      expect(pendingBefore).to.be.gt(0);

      // 预估输出数量
      const estimatedOutput = await metaStake.getSwapAmountOut(pendingBefore, ethers.ZeroAddress);
      expect(estimatedOutput).to.be.gt(0);

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      const deadline = (await time.latest()) + 3600;

      // 领取并交换
      const tx = await metaStake.connect(user1).claimAndSwap(
        0,
        ethers.ZeroAddress, // ETH
        estimatedOutput * 90n / 100n, // 允许10%滑点
        deadline
      );

      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const ethReceived = balanceAfter - balanceBefore + gasUsed;

      // 验证收到了ETH
      expect(ethReceived).to.be.gt(0);
      
      // 验证用户奖励已清零
      const user = await metaStake.users(0, user1.address);
      expect(user.pendingMetaNode).to.equal(0);
    });

    it("应该发出ClaimedAndSwapped事件", async function () {
      const pendingBefore = await metaStake.pendingReward(0, user1.address);
      const deadline = (await time.latest()) + 3600;
      const estimatedOutput = await metaStake.getSwapAmountOut(pendingBefore, ethers.ZeroAddress);

      const tx = await metaStake.connect(user1).claimAndSwap(
        0,
        ethers.ZeroAddress,
        estimatedOutput * 90n / 100n,
        deadline
      );
      
      const receipt = await tx.wait();
      
      // 从事件中获取实际值
      const claimedEvent = receipt.logs.find(
        log => {
          try {
            const parsed = metaStake.interface.parseLog(log);
            return parsed && parsed.name === "Claimed";
          } catch {
            return false;
          }
        }
      );
      
      const swappedEvent = receipt.logs.find(
        log => {
          try {
            const parsed = metaStake.interface.parseLog(log);
            return parsed && parsed.name === "ClaimedAndSwapped";
          } catch {
            return false;
          }
        }
      );
      
      expect(claimedEvent).to.not.be.undefined;
      expect(swappedEvent).to.not.be.undefined;
      
      const claimedParsed = metaStake.interface.parseLog(claimedEvent);
      const swappedParsed = metaStake.interface.parseLog(swappedEvent);
      
      await expect(tx)
        .to.emit(metaStake, "ClaimedAndSwapped")
        .withArgs(
          user1.address,
          0,
          claimedParsed.args[2], // 使用实际claim的数量
          ethers.ZeroAddress,
          swappedParsed.args[4] // 使用实际交换的数量
        );
    });
  });

  describe("领取并交换奖励（交换成ERC20代币）", function () {
    beforeEach(async function () {
      // 用户质押
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 挖区块产生奖励
      for (let i = 0; i < 10; i++) {
        await time.advanceBlock();
      }
    });

    it("用户应该能够领取奖励并自动交换成ERC20代币", async function () {
      const pendingBefore = await metaStake.pendingReward(0, user1.address);
      expect(pendingBefore).to.be.gt(0);

      // 预估输出数量
      const estimatedOutput = await metaStake.getSwapAmountOut(
        pendingBefore,
        await mockOutputToken.getAddress()
      );
      expect(estimatedOutput).to.be.gt(0);

      const balanceBefore = await mockOutputToken.balanceOf(user1.address);
      const deadline = (await time.latest()) + 3600;

      // 领取并交换
      await metaStake.connect(user1).claimAndSwap(
        0,
        await mockOutputToken.getAddress(),
        estimatedOutput * 90n / 100n, // 允许10%滑点
        deadline
      );

      const balanceAfter = await mockOutputToken.balanceOf(user1.address);
      const tokensReceived = balanceAfter - balanceBefore;

      // 验证收到了代币
      expect(tokensReceived).to.be.gt(0);
      
      // 验证用户奖励已清零
      const user = await metaStake.users(0, user1.address);
      expect(user.pendingMetaNode).to.equal(0);
    });
  });

  describe("预估交换输出", function () {
    it("应该能够预估交换成ETH的输出数量", async function () {
      const amountIn = ethers.parseEther("100");
      const estimatedOutput = await metaStake.getSwapAmountOut(amountIn, ethers.ZeroAddress);
      
      // 根据Mock Router的设置，1 MetaNode = 0.1 WETH
      expect(estimatedOutput).to.equal(ethers.parseEther("10")); // 100 * 0.1 = 10 WETH
    });

    it("应该能够预估交换成ERC20代币的输出数量", async function () {
      const amountIn = ethers.parseEther("100");
      const estimatedOutput = await metaStake.getSwapAmountOut(
        amountIn,
        await mockOutputToken.getAddress()
      );
      
      // 根据Mock Router的设置，1 MetaNode = 0.1 WETH = 100 OutputToken
      expect(estimatedOutput).to.equal(ethers.parseEther("10000")); // 100 * 0.1 * 1000 = 10000
    });

    it("如果Router未设置，应该返回0", async function () {
      // 创建一个新的MetaStake实例，不设置Router
      const MetaStake = await ethers.getContractFactory("MetaStake");
      const startBlock = await ethers.provider.getBlockNumber();
      const newMetaStake = await upgrades.deployProxy(
        MetaStake,
        [
          await metaNodeToken.getAddress(),
          META_NODE_PER_BLOCK,
          startBlock,
          admin.address,
        ],
        { initializer: "initialize" }
      );
      await newMetaStake.waitForDeployment();

      const estimatedOutput = await newMetaStake.getSwapAmountOut(
        ethers.parseEther("100"),
        ethers.ZeroAddress
      );
      expect(estimatedOutput).to.equal(0);
    });
  });

  describe("错误处理", function () {
    beforeEach(async function () {
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      for (let i = 0; i < 10; i++) {
        await time.advanceBlock();
      }
    });

    it("如果Router未设置，应该失败", async function () {
      // 创建一个新的MetaStake实例，不设置Router
      const MetaStake = await ethers.getContractFactory("MetaStake");
      const startBlock = await ethers.provider.getBlockNumber();
      const newMetaStake = await upgrades.deployProxy(
        MetaStake,
        [
          await metaNodeToken.getAddress(),
          META_NODE_PER_BLOCK,
          startBlock,
          admin.address,
        ],
        { initializer: "initialize" }
      );
      await newMetaStake.waitForDeployment();

      await metaNodeToken.mint(await newMetaStake.getAddress(), ethers.parseEther("1000000"));
      await newMetaStake.connect(admin).addPool(
        ethers.ZeroAddress,
        ethers.parseEther("1"),
        MIN_DEPOSIT,
        UNSTAKE_LOCKED_BLOCKS
      );

      await newMetaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      for (let i = 0; i < 10; i++) {
        await time.advanceBlock();
      }

      const deadline = (await time.latest()) + 3600;
      await expect(
        newMetaStake.connect(user1).claimAndSwap(
          0,
          ethers.ZeroAddress,
          0,
          deadline
        )
      ).to.be.revertedWith("Uniswap router not set");
    });

    it("如果没有奖励，应该失败", async function () {
      // 创建一个新用户，没有质押
      const [userWithoutStake] = await ethers.getSigners();
      
      const deadline = (await time.latest()) + 3600;
      await expect(
        metaStake.connect(userWithoutStake).claimAndSwap(
          0,
          ethers.ZeroAddress,
          0,
          deadline
        )
      ).to.be.revertedWith("No reward to claim");
    });
  });
});

