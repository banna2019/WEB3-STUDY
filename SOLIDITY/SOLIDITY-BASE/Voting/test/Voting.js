const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let voting;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  beforeEach(async function () {
    // 获取签名者
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    // 部署合约
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  describe("部署", function () {
    it("应该正确设置所有者", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("初始候选人数量应该为 0", async function () {
      expect(await voting.getCandidateCount()).to.equal(0);
    });

    it("初始得票数应该为 0", async function () {
      expect(await voting.getVotes("Alice")).to.equal(0);
    });
  });

  describe("投票功能", function () {
    it("应该允许用户投票给候选人", async function () {
      await expect(voting.connect(voter1).vote("Alice"))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, "Alice", 1);

      expect(await voting.getVotes("Alice")).to.equal(1);
      expect(await voting.checkHasVoted(voter1.address)).to.be.true;
    });

    it("应该增加候选人的得票数", async function () {
      await voting.connect(voter1).vote("Alice");
      await voting.connect(voter2).vote("Alice");
      await voting.connect(voter3).vote("Alice");

      expect(await voting.getVotes("Alice")).to.equal(3);
    });

    it("应该将新候选人添加到候选人列表", async function () {
      await voting.connect(voter1).vote("Alice");
      expect(await voting.getCandidateCount()).to.equal(1);
      expect(await voting.getCandidate(0)).to.equal("Alice");
    });

    it("不应该重复添加已存在的候选人", async function () {
      await voting.connect(voter1).vote("Alice");
      await voting.connect(voter2).vote("Alice");
      expect(await voting.getCandidateCount()).to.equal(1);
    });

    it("应该允许不同用户投票给不同候选人", async function () {
      await voting.connect(voter1).vote("Alice");
      await voting.connect(voter2).vote("Bob");
      await voting.connect(voter3).vote("Charlie");

      expect(await voting.getVotes("Alice")).to.equal(1);
      expect(await voting.getVotes("Bob")).to.equal(1);
      expect(await voting.getVotes("Charlie")).to.equal(1);
      expect(await voting.getCandidateCount()).to.equal(3);
    });

    it("应该防止用户重复投票", async function () {
      await voting.connect(voter1).vote("Alice");
      
      await expect(
        voting.connect(voter1).vote("Bob")
      ).to.be.revertedWith("You have already voted");
    });

    it("应该拒绝空候选人名称", async function () {
      await expect(
        voting.connect(voter1).vote("")
      ).to.be.revertedWith("Candidate name cannot be empty");
    });

    it("应该正确触发 Voted 事件", async function () {
      await expect(voting.connect(voter1).vote("Alice"))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, "Alice", 1);
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      await voting.connect(voter1).vote("Alice");
      await voting.connect(voter2).vote("Bob");
      await voting.connect(voter3).vote("Alice");
    });

    it("应该正确返回候选人的得票数", async function () {
      expect(await voting.getVotes("Alice")).to.equal(2);
      expect(await voting.getVotes("Bob")).to.equal(1);
      expect(await voting.getVotes("Charlie")).to.equal(0);
    });

    it("应该正确返回候选人总数", async function () {
      expect(await voting.getCandidateCount()).to.equal(2);
    });

    it("应该正确返回指定索引的候选人", async function () {
      const candidate0 = await voting.getCandidate(0);
      const candidate1 = await voting.getCandidate(1);
      
      // 候选人顺序可能不同，但应该包含 Alice 和 Bob
      expect(["Alice", "Bob"]).to.include(candidate0);
      expect(["Alice", "Bob"]).to.include(candidate1);
      expect(candidate0).to.not.equal(candidate1);
    });

    it("应该拒绝超出范围的索引", async function () {
      await expect(
        voting.getCandidate(10)
      ).to.be.revertedWith("Index out of bounds");
    });

    it("应该正确检查投票状态", async function () {
      expect(await voting.checkHasVoted(voter1.address)).to.be.true;
      expect(await voting.checkHasVoted(voter2.address)).to.be.true;
      expect(await voting.checkHasVoted(voter3.address)).to.be.true;
      
      // 创建一个新账户
      const [, , , , voter4] = await ethers.getSigners();
      expect(await voting.checkHasVoted(voter4.address)).to.be.false;
    });
  });

  describe("重置功能", function () {
    beforeEach(async function () {
      await voting.connect(voter1).vote("Alice");
      await voting.connect(voter2).vote("Bob");
      await voting.connect(voter3).vote("Alice");
    });

    it("应该允许所有者重置所有投票", async function () {
      await expect(voting.connect(owner).resetVotes())
        .to.emit(voting, "VotesReset")
        .withArgs(owner.address);

      expect(await voting.getVotes("Alice")).to.equal(0);
      expect(await voting.getVotes("Bob")).to.equal(0);
    });

    it("不应该允许非所有者重置投票", async function () {
      await expect(
        voting.connect(voter1).resetVotes()
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("应该允许所有者重置指定候选人的得票数", async function () {
      await voting.connect(owner).resetCandidateVotes("Alice");
      
      expect(await voting.getVotes("Alice")).to.equal(0);
      expect(await voting.getVotes("Bob")).to.equal(1); // Bob 的票数应该保持不变
    });

    it("应该允许所有者重置投票者状态", async function () {
      await voting.connect(owner).resetVoterStatus(voter1.address);
      
      expect(await voting.checkHasVoted(voter1.address)).to.be.false;
      
      // 现在 voter1 应该可以再次投票
      await expect(voting.connect(voter1).vote("Charlie"))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, "Charlie", 1);
    });

    it("应该允许所有者重置多个投票者状态", async function () {
      await voting.connect(owner).resetAllVoterStatus([
        voter1.address,
        voter2.address
      ]);
      
      expect(await voting.checkHasVoted(voter1.address)).to.be.false;
      expect(await voting.checkHasVoted(voter2.address)).to.be.false;
      expect(await voting.checkHasVoted(voter3.address)).to.be.true; // voter3 状态不变
    });
  });

  describe("边界情况", function () {
    it("应该处理多个相同候选人的投票", async function () {
      for (let i = 0; i < 5; i++) {
        const voter = (await ethers.getSigners())[i + 1];
        await voting.connect(voter).vote("Alice");
      }
      
      expect(await voting.getVotes("Alice")).to.equal(5);
      expect(await voting.getCandidateCount()).to.equal(1);
    });

    it("应该处理长候选人名称", async function () {
      const longName = "A".repeat(100);
      await voting.connect(voter1).vote(longName);
      
      expect(await voting.getVotes(longName)).to.equal(1);
      expect(await voting.getCandidate(0)).to.equal(longName);
    });

    it("应该处理特殊字符的候选人名称", async function () {
      const specialName = "Candidate-Name_123";
      await voting.connect(voter1).vote(specialName);
      
      expect(await voting.getVotes(specialName)).to.equal(1);
    });
  });

  describe("事件", function () {
    it("应该为每次投票触发 Voted 事件", async function () {
      await expect(voting.connect(voter1).vote("Alice"))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, "Alice", 1);

      await expect(voting.connect(voter2).vote("Alice"))
        .to.emit(voting, "Voted")
        .withArgs(voter2.address, "Alice", 2);
    });

    it("应该为重置投票触发 VotesReset 事件", async function () {
      await voting.connect(voter1).vote("Alice");
      
      await expect(voting.connect(owner).resetVotes())
        .to.emit(voting, "VotesReset")
        .withArgs(owner.address);
    });
  });
});

