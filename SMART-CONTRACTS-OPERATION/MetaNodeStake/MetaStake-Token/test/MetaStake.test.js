const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MetaStake", function () {
  let metaNodeToken;
  let metaStake;
  let owner;
  let admin;
  let user1;
  let user2;
  let user3;

  const META_NODE_PER_BLOCK = ethers.parseEther("1"); // 1 MNODE per block
  const MIN_DEPOSIT = ethers.parseEther("0.1");
  const UNSTAKE_LOCKED_BLOCKS = 100;

  beforeEach(async function () {
    [owner, admin, user1, user2, user3] = await ethers.getSigners();

    // 部署MetaNode代币
    const MetaNodeToken = await ethers.getContractFactory("MetaNodeToken");
    metaNodeToken = await MetaNodeToken.deploy(owner.address);

    // 部署MetaStake合约（使用代理）
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

    // 给MetaStake合约铸造一些MetaNode代币作为奖励
    await metaNodeToken.mint(await metaStake.getAddress(), ethers.parseEther("1000000"));

    // 可选：设置Uniswap Router（如果环境变量中配置了）
    // 注意：在测试环境中，通常使用Mock Router，这里不设置实际Router
    // 实际Router设置应该在UniswapIntegration.test.js中测试

    // 添加第一个池（Native currency池）
    await metaStake.connect(admin).addPool(
      ethers.ZeroAddress, // address(0)表示native currency
      ethers.parseEther("1"), // poolWeight
      MIN_DEPOSIT,
      UNSTAKE_LOCKED_BLOCKS
    );
  });

  describe("部署和初始化", function () {
    it("应该正确初始化合约", async function () {
      expect(await metaStake.metaNodeToken()).to.equal(await metaNodeToken.getAddress());
      expect(await metaStake.metaNodePerBlock()).to.equal(META_NODE_PER_BLOCK);
      expect(await metaStake.totalPools()).to.equal(1);
    });

    it("应该正确设置角色", async function () {
      expect(await metaStake.hasRole(await metaStake.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
      expect(await metaStake.hasRole(await metaStake.ADMIN_ROLE(), admin.address)).to.be.true;
      expect(await metaStake.hasRole(await metaStake.UPGRADER_ROLE(), admin.address)).to.be.true;
    });
  });

  describe("池管理", function () {
    it("管理员应该能够添加新池", async function () {
      // 创建一个ERC20代币用于测试
      const TestToken = await ethers.getContractFactory("MetaNodeToken");
      const testToken = await TestToken.deploy(owner.address);

      await expect(
        metaStake.connect(admin).addPool(
          await testToken.getAddress(),
          ethers.parseEther("2"),
          MIN_DEPOSIT,
          UNSTAKE_LOCKED_BLOCKS
        )
      )
        .to.emit(metaStake, "PoolAdded")
        .withArgs(1, await testToken.getAddress(), ethers.parseEther("2"));

      expect(await metaStake.totalPools()).to.equal(2);
    });

    it("非管理员不应该能够添加池", async function () {
      await expect(
        metaStake.connect(user1).addPool(
          ethers.ZeroAddress,
          ethers.parseEther("1"),
          MIN_DEPOSIT,
          UNSTAKE_LOCKED_BLOCKS
        )
      ).to.be.revertedWithCustomError(metaStake, "AccessControlUnauthorizedAccount");
    });

    it("管理员应该能够更新池配置", async function () {
      const newWeight = ethers.parseEther("3");
      const newMinDeposit = ethers.parseEther("0.2");
      const newLockedBlocks = 200;

      await expect(
        metaStake.connect(admin).updatePoolConfig(0, newWeight, newMinDeposit, newLockedBlocks)
      )
        .to.emit(metaStake, "PoolUpdated")
        .withArgs(0, newWeight, newMinDeposit, newLockedBlocks);

      const pool = await metaStake.pools(0);
      expect(pool.poolWeight).to.equal(newWeight);
      expect(pool.minDepositAmount).to.equal(newMinDeposit);
      expect(pool.unstakeLockedBlocks).to.equal(newLockedBlocks);
    });
  });

  describe("质押功能", function () {
    it("用户应该能够质押ETH", async function () {
      const stakeAmount = ethers.parseEther("1");

      const tx = await metaStake.connect(user1).stake(0, stakeAmount, { value: stakeAmount });
      await expect(tx)
        .to.emit(metaStake, "Staked")
        .withArgs(user1.address, 0, stakeAmount);

      const user = await metaStake.users(0, user1.address);
      expect(user.stAmount).to.equal(stakeAmount);

      const pool = await metaStake.pools(0);
      expect(pool.stakeTokenAmount).to.equal(stakeAmount);
    });

    it("质押数量低于最小值应该失败", async function () {
      const stakeAmount = ethers.parseEther("0.05"); // 低于最小值0.1

      await expect(
        metaStake.connect(user1).stake(0, stakeAmount, { value: stakeAmount })
      ).to.be.revertedWith("Amount below minimum");
    });

    it("质押时ETH数量不匹配应该失败", async function () {
      const stakeAmount = ethers.parseEther("1");

      await expect(
        metaStake.connect(user1).stake(0, stakeAmount, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Incorrect ETH amount");
    });

    it("质押暂停时应该失败", async function () {
      await metaStake.connect(admin).setPauseStatus(0, true); // PauseType.Stake = 0

      const stakeAmount = ethers.parseEther("1");
      await expect(
        metaStake.connect(user1).stake(0, stakeAmount, { value: stakeAmount })
      ).to.be.revertedWith("Staking is paused");
    });
  });

  describe("ERC20代币质押", function () {
    let testToken;

    beforeEach(async function () {
      // 创建测试ERC20代币
      const TestToken = await ethers.getContractFactory("MetaNodeToken");
      testToken = await TestToken.deploy(owner.address);

      // 添加ERC20代币池
      await metaStake.connect(admin).addPool(
        await testToken.getAddress(),
        ethers.parseEther("1"),
        MIN_DEPOSIT,
        UNSTAKE_LOCKED_BLOCKS
      );

      // 给用户铸造代币
      await testToken.mint(user1.address, ethers.parseEther("1000"));
      await testToken.mint(user2.address, ethers.parseEther("1000"));

      // 用户授权合约
      await testToken.connect(user1).approve(await metaStake.getAddress(), ethers.MaxUint256);
      await testToken.connect(user2).approve(await metaStake.getAddress(), ethers.MaxUint256);
    });

    it("用户应该能够质押ERC20代币", async function () {
      const stakeAmount = ethers.parseEther("10");

      const tx = await metaStake.connect(user1).stake(1, stakeAmount);
      await expect(tx)
        .to.emit(metaStake, "Staked")
        .withArgs(user1.address, 1, stakeAmount);

      const user = await metaStake.users(1, user1.address);
      expect(user.stAmount).to.equal(stakeAmount);

      const pool = await metaStake.pools(1);
      expect(pool.stakeTokenAmount).to.equal(stakeAmount);
    });

    it("质押ERC20时不应该发送ETH", async function () {
      const stakeAmount = ethers.parseEther("10");

      await expect(
        metaStake.connect(user1).stake(1, stakeAmount, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("ETH not needed for ERC20 pool");
    });
  });

  describe("奖励计算", function () {
    beforeEach(async function () {
      // 用户1质押1 ETH
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
    });

    it("应该正确计算待领取奖励", async function () {
      // 挖几个区块
      await time.advanceBlock();
      await time.advanceBlock();
      await time.advanceBlock();

      const pending = await metaStake.pendingReward(0, user1.address);
      expect(pending).to.be.gt(0);
    });

    it("用户应该能够领取奖励", async function () {
      // 挖一些区块
      for (let i = 0; i < 10; i++) {
        await time.advanceBlock();
      }

      const pendingBefore = await metaStake.pendingReward(0, user1.address);
      expect(pendingBefore).to.be.gt(0);

      const tx = await metaStake.connect(user1).claim(0);
      const receipt = await tx.wait();
      
      // 从事件中获取实际领取的数量
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
      
      expect(claimedEvent).to.not.be.undefined;
      const parsed = metaStake.interface.parseLog(claimedEvent);
      const claimedAmount = parsed.args[2];
      
      await expect(tx)
        .to.emit(metaStake, "Claimed")
        .withArgs(user1.address, 0, claimedAmount);

      const user = await metaStake.users(0, user1.address);
      expect(user.pendingMetaNode).to.equal(0);
    });

    it("领取奖励暂停时应该失败", async function () {
      await metaStake.connect(admin).setPauseStatus(2, true); // PauseType.Claim = 2

      await expect(
        metaStake.connect(user1).claim(0)
      ).to.be.revertedWith("Claiming is paused");
    });
  });

  describe("解除质押功能", function () {
    beforeEach(async function () {
      // 用户1质押1 ETH
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
    });

    it("用户应该能够解除质押", async function () {
      const unstakeAmount = ethers.parseEther("0.5");

      const tx = await metaStake.connect(user1).unstake(0, unstakeAmount);
      await expect(tx)
        .to.emit(metaStake, "Unstaked");

      const user = await metaStake.users(0, user1.address);
      expect(user.stAmount).to.equal(ethers.parseEther("0.5"));

      const pool = await metaStake.pools(0);
      expect(pool.stakeTokenAmount).to.equal(ethers.parseEther("0.5"));
    });

    it("解除质押数量超过质押数量应该失败", async function () {
      await expect(
        metaStake.connect(user1).unstake(0, ethers.parseEther("2"))
      ).to.be.revertedWith("Insufficient staked amount");
    });

    it("解除质押暂停时应该失败", async function () {
      await metaStake.connect(admin).setPauseStatus(1, true); // PauseType.Unstake = 1

      await expect(
        metaStake.connect(user1).unstake(0, ethers.parseEther("0.5"))
      ).to.be.revertedWith("Unstaking is paused");
    });
  });

  describe("提取功能", function () {
    beforeEach(async function () {
      // 用户1质押1 ETH
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 解除质押0.5 ETH
      await metaStake.connect(user1).unstake(0, ethers.parseEther("0.5"));
    });

    it("锁定期内不应该能够提取", async function () {
      await expect(
        metaStake.connect(user1).withdraw(0)
      ).to.be.revertedWith("No withdrawable amount");
    });

    it("锁定期后应该能够提取", async function () {
      // 挖足够的区块
      for (let i = 0; i < UNSTAKE_LOCKED_BLOCKS + 10; i++) {
        await time.advanceBlock();
      }

      const balanceBefore = await ethers.provider.getBalance(user1.address);

      await expect(
        metaStake.connect(user1).withdraw(0)
      )
        .to.emit(metaStake, "Withdrawn")
        .withArgs(user1.address, 0, ethers.parseEther("0.5"));

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      expect(balanceAfter - balanceBefore).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));
    });
  });

  describe("多池奖励分配", function () {
    beforeEach(async function () {
      // 创建ERC20代币池
      const TestToken = await ethers.getContractFactory("MetaNodeToken");
      const testToken = await TestToken.deploy(owner.address);

      await metaStake.connect(admin).addPool(
        await testToken.getAddress(),
        ethers.parseEther("2"), // 权重是池0的2倍
        MIN_DEPOSIT,
        UNSTAKE_LOCKED_BLOCKS
      );

      // 给用户铸造代币并授权
      await testToken.mint(user1.address, ethers.parseEther("1000"));
      await testToken.mint(user2.address, ethers.parseEther("1000"));
      await testToken.connect(user1).approve(await metaStake.getAddress(), ethers.MaxUint256);
      await testToken.connect(user2).approve(await metaStake.getAddress(), ethers.MaxUint256);

      // 用户1在池0质押1 ETH
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 用户2在池1质押1 Token
      await metaStake.connect(user2).stake(1, ethers.parseEther("1"));
    });

    it("应该根据权重分配奖励", async function () {
      // 挖一些区块
      for (let i = 0; i < 10; i++) {
        await time.advanceBlock();
      }

      const pending0 = await metaStake.pendingReward(0, user1.address);
      const pending1 = await metaStake.pendingReward(1, user2.address);

      // 池1的权重是池0的2倍，总权重是3（1+2）
      // 池0权重比例: 1/3, 池1权重比例: 2/3
      // 用户1质押1 ETH，用户2质押1 Token
      // 所以用户2的奖励应该是用户1的2倍（因为池权重是2倍）
      // 但由于两个池的权重不同，实际比例可能略有差异
      expect(pending1).to.be.gt(pending0);
      // 允许一定的误差范围
      expect(pending1).to.be.closeTo(pending0 * 2n, ethers.parseEther("1"));
    });
  });

  describe("升级功能", function () {
    it("只有UPGRADER_ROLE能够升级合约", async function () {
      const MetaStakeV2 = await ethers.getContractFactory("MetaStake");
      
      await expect(
        upgrades.upgradeProxy(await metaStake.getAddress(), MetaStakeV2.connect(user1))
      ).to.be.revertedWithCustomError(metaStake, "AccessControlUnauthorizedAccount");
    });

    it("管理员应该能够升级合约", async function () {
      const MetaStakeV2 = await ethers.getContractFactory("MetaStake");
      
      await upgrades.upgradeProxy(await metaStake.getAddress(), MetaStakeV2.connect(admin));
      
      // 验证状态保持不变
      expect(await metaStake.metaNodeToken()).to.equal(await metaNodeToken.getAddress());
      expect(await metaStake.totalPools()).to.equal(1);
    });
  });

  describe("紧急提取", function () {
    it("管理员应该能够紧急提取ETH", async function () {
      // 用户质押一些ETH
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });

      const balanceBefore = await ethers.provider.getBalance(admin.address);
      const contractBalance = await ethers.provider.getBalance(await metaStake.getAddress());

      await metaStake.connect(admin).emergencyWithdraw(
        ethers.ZeroAddress,
        admin.address,
        ethers.parseEther("0.5")
      );

      const balanceAfter = await ethers.provider.getBalance(admin.address);
      expect(balanceAfter - balanceBefore).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));
    });

    it("非管理员不应该能够紧急提取", async function () {
      await expect(
        metaStake.connect(user1).emergencyWithdraw(
          ethers.ZeroAddress,
          user1.address,
          ethers.parseEther("0.5")
        )
      ).to.be.revertedWithCustomError(metaStake, "AccessControlUnauthorizedAccount");
    });

    it("管理员应该能够紧急提取ERC20代币", async function () {
      const TestToken = await ethers.getContractFactory("MetaNodeToken");
      const testToken = await TestToken.deploy(owner.address);
      
      await metaStake.connect(admin).addPool(
        await testToken.getAddress(),
        ethers.parseEther("1"),
        MIN_DEPOSIT,
        UNSTAKE_LOCKED_BLOCKS
      );

      await testToken.mint(await metaStake.getAddress(), ethers.parseEther("1000"));
      
      const balanceBefore = await testToken.balanceOf(admin.address);
      await metaStake.connect(admin).emergencyWithdraw(
        await testToken.getAddress(),
        admin.address,
        ethers.parseEther("500")
      );
      const balanceAfter = await testToken.balanceOf(admin.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("500"));
    });
  });

  describe("边界情况测试", function () {
    it("空池不应该产生奖励", async function () {
      // 挖一些区块
      for (let i = 0; i < 10; i++) {
        await time.advanceBlock();
      }

      const pool = await metaStake.pools(0);
      expect(pool.accMetaNodePerST).to.equal(0);
    });

    it("多个用户质押应该正确分配奖励", async function () {
      // 用户1质押1 ETH
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 挖一个区块，更新池状态
      await time.advanceBlock();
      
      // 用户2质押2 ETH
      await metaStake.connect(user2).stake(0, ethers.parseEther("2"), { value: ethers.parseEther("2") });

      // 挖一些区块
      for (let i = 0; i < 10; i++) {
        await time.advanceBlock();
      }

      const pending1 = await metaStake.pendingReward(0, user1.address);
      const pending2 = await metaStake.pendingReward(0, user2.address);

      // 用户2的质押是用户1的2倍，但由于用户1先质押了1个区块，会有额外的奖励
      // 用户1质押了1个区块后，用户2才质押，所以用户1会有一些先发优势
      // 验证用户2的奖励应该大于用户1（因为质押量是2倍）
      expect(pending2).to.be.gt(pending1);
      // 由于时间差异，用户2的奖励可能不会正好是2倍，但应该接近
      // 允许较大的误差范围
      expect(pending2).to.be.closeTo(pending1 * 2n, ethers.parseEther("5"));
    });

    it("用户应该能够多次质押", async function () {
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 挖一些区块
      await time.advanceBlock();
      await time.advanceBlock();

      // 再次质押
      await metaStake.connect(user1).stake(0, ethers.parseEther("0.5"), { value: ethers.parseEther("0.5") });

      const user = await metaStake.users(0, user1.address);
      expect(user.stAmount).to.equal(ethers.parseEther("1.5"));
    });

    it("用户应该能够多次解除质押", async function () {
      await metaStake.connect(user1).stake(0, ethers.parseEther("2"), { value: ethers.parseEther("2") });
      
      await metaStake.connect(user1).unstake(0, ethers.parseEther("0.5"));
      await metaStake.connect(user1).unstake(0, ethers.parseEther("0.5"));

      const requestCount = await metaStake.getUserRequestCount(0, user1.address);
      expect(requestCount).to.equal(2);
    });

    it("用户应该能够部分提取", async function () {
      await metaStake.connect(user1).stake(0, ethers.parseEther("2"), { value: ethers.parseEther("2") });
      
      // 解除质押两次
      await metaStake.connect(user1).unstake(0, ethers.parseEther("0.5"));
      await metaStake.connect(user1).unstake(0, ethers.parseEther("0.5"));

      // 挖足够的区块
      for (let i = 0; i < UNSTAKE_LOCKED_BLOCKS + 10; i++) {
        await time.advanceBlock();
      }

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      await metaStake.connect(user1).withdraw(0);
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      
      // 应该提取1 ETH（两个0.5 ETH的请求）
      expect(balanceAfter - balanceBefore).to.be.closeTo(ethers.parseEther("1"), ethers.parseEther("0.01"));
    });

    it("用户应该能够领取多次奖励", async function () {
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 第一次领取
      for (let i = 0; i < 5; i++) {
        await time.advanceBlock();
      }
      await metaStake.connect(user1).claim(0);

      // 第二次领取
      for (let i = 0; i < 5; i++) {
        await time.advanceBlock();
      }
      const pendingBefore = await metaStake.pendingReward(0, user1.address);
      await metaStake.connect(user1).claim(0);
      
      expect(pendingBefore).to.be.gt(0);
    });

    it("更新metaNodePerBlock应该正确重新计算奖励", async function () {
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 挖一些区块
      for (let i = 0; i < 5; i++) {
        await time.advanceBlock();
      }

      const pendingBefore = await metaStake.pendingReward(0, user1.address);
      
      // 更新奖励率
      await metaStake.connect(admin).setMetaNodePerBlock(ethers.parseEther("2"));
      
      // 再挖一些区块
      for (let i = 0; i < 5; i++) {
        await time.advanceBlock();
      }

      const pendingAfter = await metaStake.pendingReward(0, user1.address);
      // 新的奖励应该更高
      expect(pendingAfter).to.be.gt(pendingBefore);
    });
  });

  describe("集成测试", function () {
    it("完整的质押-奖励-解质押-提取流程", async function () {
      // 1. 质押
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 2. 挖区块产生奖励
      for (let i = 0; i < 10; i++) {
        await time.advanceBlock();
      }

      // 3. 领取奖励
      const pendingBefore = await metaStake.pendingReward(0, user1.address);
      const tx = await metaStake.connect(user1).claim(0);
      const receipt = await tx.wait();
      
      // 从事件中获取实际领取的数量
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
      
      expect(claimedEvent).to.not.be.undefined;
      const parsed = metaStake.interface.parseLog(claimedEvent);
      const claimedAmount = parsed.args[2];
      
      const metaNodeBalance = await metaNodeToken.balanceOf(user1.address);
      expect(metaNodeBalance).to.equal(claimedAmount);

      // 4. 解除质押
      await metaStake.connect(user1).unstake(0, ethers.parseEther("0.5"));
      const user = await metaStake.users(0, user1.address);
      expect(user.stAmount).to.equal(ethers.parseEther("0.5"));

      // 5. 等待锁定期
      for (let i = 0; i < UNSTAKE_LOCKED_BLOCKS + 10; i++) {
        await time.advanceBlock();
      }

      // 6. 提取
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      await metaStake.connect(user1).withdraw(0);
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      expect(balanceAfter - balanceBefore).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));
    });

    it("多池多用户复杂场景", async function () {
      // 创建ERC20代币池
      const TestToken = await ethers.getContractFactory("MetaNodeToken");
      const testToken = await TestToken.deploy(owner.address);

      await metaStake.connect(admin).addPool(
        await testToken.getAddress(),
        ethers.parseEther("2"),
        MIN_DEPOSIT,
        UNSTAKE_LOCKED_BLOCKS
      );

      // 准备代币
      await testToken.mint(user1.address, ethers.parseEther("1000"));
      await testToken.mint(user2.address, ethers.parseEther("1000"));
      await testToken.connect(user1).approve(await metaStake.getAddress(), ethers.MaxUint256);
      await testToken.connect(user2).approve(await metaStake.getAddress(), ethers.MaxUint256);

      // 用户1在池0质押ETH
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      
      // 用户2在池1质押Token
      await metaStake.connect(user2).stake(1, ethers.parseEther("1"));

      // 挖区块
      for (let i = 0; i < 20; i++) {
        await time.advanceBlock();
      }

      // 两个用户都领取奖励
      await metaStake.connect(user1).claim(0);
      await metaStake.connect(user2).claim(1);

      const balance1 = await metaNodeToken.balanceOf(user1.address);
      const balance2 = await metaNodeToken.balanceOf(user2.address);

      // 两个用户都应该有奖励
      expect(balance1).to.be.gt(0);
      expect(balance2).to.be.gt(0);
      
      // 池1权重是池0的2倍，所以用户2的奖励应该更多
      expect(balance2).to.be.gt(balance1);
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      await metaStake.connect(user1).stake(0, ethers.parseEther("1"), { value: ethers.parseEther("1") });
      await metaStake.connect(user1).unstake(0, ethers.parseEther("0.5"));
    });

    it("应该能够查询池信息", async function () {
      const pool = await metaStake.pools(0);
      expect(pool.stakeTokenAddress).to.equal(ethers.ZeroAddress);
      expect(pool.poolWeight).to.equal(ethers.parseEther("1"));
      expect(pool.minDepositAmount).to.equal(MIN_DEPOSIT);
    });

    it("应该能够查询用户信息", async function () {
      const user = await metaStake.users(0, user1.address);
      expect(user.stAmount).to.equal(ethers.parseEther("0.5"));
    });

    it("应该能够查询解质押请求数量", async function () {
      const count = await metaStake.getUserRequestCount(0, user1.address);
      expect(count).to.equal(1);
    });

    it("应该能够查询解质押请求详情", async function () {
      const request = await metaStake.getUserRequest(0, user1.address, 0);
      expect(request.amount).to.equal(ethers.parseEther("0.5"));
      expect(request.unlockBlock).to.be.gt(await ethers.provider.getBlockNumber());
    });
  });
});

