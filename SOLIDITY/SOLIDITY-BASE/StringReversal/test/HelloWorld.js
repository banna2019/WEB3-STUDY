const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HelloWorld", function () {
  let helloWorld;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const HelloWorld = await ethers.getContractFactory("HelloWorld");
    helloWorld = await HelloWorld.deploy("Hello, Hardhat!");
    await helloWorld.waitForDeployment();
  });

  it("应该设置正确的初始消息", async function () {
    expect(await helloWorld.message()).to.equal("Hello, Hardhat!");
  });

  it("应该能够更新消息", async function () {
    await helloWorld.setMessage("New Message");
    expect(await helloWorld.message()).to.equal("New Message");
  });

  it("应该能够获取消息", async function () {
    const message = await helloWorld.getMessage();
    expect(message).to.equal("Hello, Hardhat!");
  });
});
