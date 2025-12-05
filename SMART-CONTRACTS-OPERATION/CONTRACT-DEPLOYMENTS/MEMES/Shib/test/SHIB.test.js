const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
require("dotenv").config();

// 从环境变量读取代币符号用于测试套件名称
const tokenSymbol = process.env.TOKEN_SYMBOL || "SHIB";

describe(`${tokenSymbol} Token Contract`, function () {
    let shib;
    let owner;
    let addr1;
    let addr2;
    let addr3;
    let taxReceiver;
    let mockRouter;
    let mockPair;

    // 零地址配置：从环境变量读取，如果未设置则使用默认值
    // 零地址用于表示空地址或未初始化的地址，常用于地址验证和默认值检查
    // 标准以太坊零地址：0x0000000000000000000000000000000000000000
    const ZERO_ADDRESS = process.env.ZERO_ADDRESS || "0x0000000000000000000000000000000000000000";
    const parseEther = ethers.parseEther;

    // Gas 信息收集数组
    const gasInfoList = [];

    // Gas 信息收集辅助函数
    async function collectGasInfo(tx, operationName) {
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed;
        const gasPrice = receipt.gasPrice || (await ethers.provider.getFeeData()).gasPrice;
        const totalCost = gasUsed * gasPrice;
        const totalCostEth = ethers.formatEther(totalCost);
        
        gasInfoList.push({
            operation: operationName,
            gasUsed: gasUsed.toString(),
            gasPrice: ethers.formatUnits(gasPrice, "gwei"),
            totalCost: totalCostEth
        });
        
        return { gasUsed, gasPrice, totalCost };
    }

    // 打印 Gas 信息汇总
    function printGasSummary() {
        if (gasInfoList.length === 0) return;
        
        console.log("\n" + "=".repeat(90));
        console.log("Gas 消耗汇总报告".padStart(50));
        console.log("=".repeat(90));
        
        // 表头
        const header = 
            "序号".padEnd(6) + 
            "操作".padEnd(42) + 
            "Gas Used".padStart(15) + 
            "Gas Price (Gwei)".padStart(18) + 
            "成本 (ETH)".padStart(18);
        console.log(header);
        console.log("-".repeat(90));
        
        let totalGasUsed = 0n;
        let totalCost = 0n;
        
        gasInfoList.forEach((info, index) => {
            const gasUsed = BigInt(info.gasUsed);
            // 计算每个操作的成本（使用精确的 BigInt 计算）
            const gasPriceWei = BigInt(Math.floor(parseFloat(info.gasPrice) * 1e9));
            const cost = gasUsed * gasPriceWei;
            totalGasUsed += gasUsed;
            totalCost += cost;
            
            const indexStr = `${index + 1}.`;
            const operationName = info.operation.length > 40 ? info.operation.substring(0, 37) + "..." : info.operation;
            const gasUsedStr = gasUsed.toLocaleString();
            const gasPriceStr = parseFloat(info.gasPrice).toFixed(6);
            const costStr = parseFloat(ethers.formatEther(cost)).toFixed(8);
            
            console.log(
                indexStr.padEnd(6) + 
                operationName.padEnd(42) + 
                gasUsedStr.padStart(15) + 
                gasPriceStr.padStart(18) + 
                costStr.padStart(18)
            );
        });
        
        console.log("-".repeat(90));
        const totalCostEth = parseFloat(ethers.formatEther(totalCost)).toFixed(8);
        console.log(
            "总计:".padEnd(48) + 
            totalGasUsed.toLocaleString().padStart(15) + 
            "".padStart(18) + 
            totalCostEth.padStart(18)
        );
        console.log("=".repeat(90));
        console.log(`\n总操作数: ${gasInfoList.length}`);
        console.log(`总 Gas 消耗: ${totalGasUsed.toLocaleString()}`);
        console.log(`总成本: ${totalCostEth} ETH\n`);
    }

    beforeEach(async function () {
        // 获取签名者
        [owner, addr1, addr2, addr3, taxReceiver] = await ethers.getSigners();

        // 从.env读取配置
        const name = process.env.TOKEN_NAME || "Shiba Inu";
        const symbol = process.env.TOKEN_SYMBOL || "SHIB";
        const totalSupplyStr = process.env.TOKEN_TOTAL_SUPPLY || "1000000000";
        const taxRate = process.env.TAX_RATE ? parseInt(process.env.TAX_RATE) : 500;
        const totalSupply = parseEther(totalSupplyStr);

        // 部署合约
        const SHIB = await ethers.getContractFactory("SHIB");
        const deployTx = await SHIB.deploy(
            name,
            symbol,
            totalSupply,
            taxRate,
            taxReceiver.address
        );
        shib = await deployTx.waitForDeployment();
        await collectGasInfo(deployTx.deploymentTransaction(), "部署 SHIB 合约");

        // 部署Mock Router用于测试
        const MockRouter = await ethers.getContractFactory("MockUniswapV2Router");
        const mockRouterDeployTx = await MockRouter.deploy(addr2.address, addr3.address);
        mockRouter = await mockRouterDeployTx.waitForDeployment();
        await collectGasInfo(mockRouterDeployTx.deploymentTransaction(), "部署 Mock Router");
        mockPair = addr1.address;
        const setPairTx = await mockRouter.setMockPair(mockPair);
        await collectGasInfo(setPairTx, "设置 Mock Pair");
    });

    describe("部署", function () {
        it("应该正确设置代币名称和符号", async function () {
            const name = process.env.TOKEN_NAME || "Shiba Inu";
            const symbol = process.env.TOKEN_SYMBOL || "SHIB";
            expect(await shib.name()).to.equal(name);
            expect(await shib.symbol()).to.equal(symbol);
        });

        it("应该正确设置总供应量", async function () {
            const totalSupplyStr = process.env.TOKEN_TOTAL_SUPPLY || "1000000000";
            const totalSupply = parseEther(totalSupplyStr);
            expect(await shib.totalSupply()).to.equal(totalSupply);
        });

        it("应该将总供应量分配给部署者", async function () {
            const totalSupplyStr = process.env.TOKEN_TOTAL_SUPPLY || "1000000000";
            const totalSupply = parseEther(totalSupplyStr);
            expect(await shib.balanceOf(owner.address)).to.equal(totalSupply);
        });

        it("应该正确设置税率", async function () {
            const taxRate = process.env.TAX_RATE ? parseInt(process.env.TAX_RATE) : 500;
            expect(await shib.taxRate()).to.equal(taxRate);
        });

        it("应该正确设置税收接收地址", async function () {
            expect(await shib.taxReceiver()).to.equal(taxReceiver.address);
        });

        it("应该将部署者加入白名单", async function () {
            expect(await shib.whitelist(owner.address)).to.equal(true);
        });
    });

    describe("代币税功能", function () {
        describe("税费计算", function () {
        beforeEach(async function () {
            // 给addr1一些代币
            const transferTx = await shib.transfer(addr1.address, parseEther("10000"));
            await collectGasInfo(transferTx, "转账给 addr1（税费计算测试）");
            // 确保addr1和addr2不在白名单
            await shib.updateWhitelist(addr1.address, false);
            await shib.updateWhitelist(addr2.address, false);
            // 确保taxReceiver不在白名单
            await shib.updateWhitelist(taxReceiver.address, false);
        });

            it("应该正确计算税费", async function () {
                const amount = parseEther("100");
                const taxRate = await shib.taxRate();
                const expectedTax = (amount * BigInt(taxRate)) / BigInt(10000);
                const tax = await shib.calculateTax(amount, addr1.address, addr2.address);
                expect(tax).to.equal(expectedTax);
            });

            it("白名单地址应该免税", async function () {
                const tx = await shib.updateWhitelist(addr1.address, true);
                await collectGasInfo(tx, "添加白名单（税费计算测试）");
                const amount = parseEther("100");
                const tax = await shib.calculateTax(amount, addr1.address, addr2.address);
                expect(tax).to.equal(0);
            });

            it("税收未启用时应该返回0", async function () {
                const tx = await shib.setTaxRate(0, taxReceiver.address);
                await collectGasInfo(tx, "禁用税收");
                const amount = parseEther("100");
                const tax = await shib.calculateTax(amount, addr1.address, addr2.address);
                expect(tax).to.equal(0);
            });
        });

        describe("税率设置", function () {
            it("应该允许拥有者设置税率", async function () {
                const tx = await shib.setTaxRate(1000, taxReceiver.address);
                await collectGasInfo(tx, "设置税率");
                expect(await shib.taxRate()).to.equal(1000);
            });

            it("非拥有者不能设置税率", async function () {
                // OpenZeppelin v5.0使用自定义错误，使用reverted来匹配任何错误
                await expect(
                    shib.connect(addr1).setTaxRate(1000, taxReceiver.address)
                ).to.be.reverted;
            });

            it("应该拒绝超过20%的税率", async function () {
                await expect(
                    shib.setTaxRate(2001, taxReceiver.address)
                ).to.be.revertedWith("SHIB: Tax rate cannot exceed 20%");
            });
        });
    });

    describe("交易限制功能", function () {
        beforeEach(async function () {
            const tx = await shib.transfer(addr1.address, parseEther("10000"));
            await collectGasInfo(tx, "转账给 addr1（交易限制测试）");
        });

        it("应该允许拥有者设置交易限制", async function () {
            const tx = await shib.setTransactionLimits(parseEther("1000"), 10);
            await collectGasInfo(tx, "设置交易限制");
            expect(await shib.maxTransactionAmount()).to.equal(parseEther("1000"));
            expect(await shib.maxDailyTransactions()).to.equal(10);
        });

        it("应该检查单笔交易最大额度", async function () {
            const setLimitTx = await shib.setTransactionLimits(parseEther("1000"), 0);
            await collectGasInfo(setLimitTx, "设置单笔交易最大额度");
            await expect(
                shib.connect(addr1).transfer(addr2.address, parseEther("1001"))
            ).to.be.revertedWith("SHIB: Transaction amount exceeds maximum");
        });

        it("应该检查每日交易次数限制", async function () {
            const setLimitTx = await shib.setTransactionLimits(0, 2);
            await collectGasInfo(setLimitTx, "设置每日交易次数限制");
            const tx1 = await shib.connect(addr1).transfer(addr2.address, parseEther("100"));
            await collectGasInfo(tx1, "第一次转账");
            const tx2 = await shib.connect(addr1).transfer(addr2.address, parseEther("100"));
            await collectGasInfo(tx2, "第二次转账");
            await expect(
                shib.connect(addr1).transfer(addr2.address, parseEther("100"))
            ).to.be.revertedWith("SHIB: Daily transaction limit exceeded");
        });
    });

    describe("黑名单/白名单功能", function () {
        beforeEach(async function () {
            const tx = await shib.transfer(addr1.address, parseEther("10000"));
            await collectGasInfo(tx, "转账给 addr1（黑名单/白名单测试）");
        });

        it("应该允许拥有者更新黑名单", async function () {
            const tx = await shib.updateBlacklist(addr1.address, true);
            await collectGasInfo(tx, "更新黑名单");
            expect(await shib.blacklists(addr1.address)).to.equal(true);
        });

        it("黑名单地址不能转账", async function () {
            const tx = await shib.updateBlacklist(addr1.address, true);
            await collectGasInfo(tx, "添加黑名单");
            await expect(
                shib.connect(addr1).transfer(addr2.address, parseEther("100"))
            ).to.be.revertedWith("SHIB: Sender is blacklisted");
        });

        it("应该允许拥有者更新白名单", async function () {
            const tx = await shib.updateWhitelist(addr1.address, true);
            await collectGasInfo(tx, "更新白名单");
            expect(await shib.whitelist(addr1.address)).to.equal(true);
        });
    });

    describe("转账功能", function () {
        beforeEach(async function () {
            const transferTx = await shib.transfer(addr1.address, parseEther("10000"));
            await collectGasInfo(transferTx, "转账给 addr1（转账功能测试）");
            // 确保addr1和addr2不在白名单
            await shib.updateWhitelist(addr1.address, false);
            await shib.updateWhitelist(addr2.address, false);
            // 确保taxReceiver不在白名单
            await shib.updateWhitelist(taxReceiver.address, false);
        });

        it("应该正确转账并扣除税费", async function () {
            const amount = parseEther("100");
            const taxRate = await shib.taxRate();
            const expectedTax = (amount * BigInt(taxRate)) / BigInt(10000);
            const expectedReceived = amount - expectedTax;

            const initialBalance = await shib.balanceOf(addr2.address);
            const initialTaxBalance = await shib.balanceOf(taxReceiver.address);

            const tx = await shib.connect(addr1).transfer(addr2.address, amount);
            await collectGasInfo(tx, "转账（含税费）");

            const finalBalance = await shib.balanceOf(addr2.address);
            const finalTaxBalance = await shib.balanceOf(taxReceiver.address);

            expect(finalBalance - initialBalance).to.equal(expectedReceived);
            expect(finalTaxBalance - initialTaxBalance).to.equal(expectedTax);
        });

        it("白名单地址转账应该免税", async function () {
            const whitelistTx = await shib.updateWhitelist(addr1.address, true);
            await collectGasInfo(whitelistTx, "添加白名单");
            const amount = parseEther("100");
            const transferTx = await shib.connect(addr1).transfer(addr2.address, amount);
            await collectGasInfo(transferTx, "白名单转账（免税）");
            const balance = await shib.balanceOf(addr2.address);
            expect(balance).to.equal(amount);
        });
    });

    describe("流动性池功能", function () {
        beforeEach(async function () {
            const routerAddress = await mockRouter.getAddress();
            const setRouterTx = await shib.setUniswapV2Router(routerAddress);
            await collectGasInfo(setRouterTx, "设置 Uniswap Router");
            const setPairTx = await shib.setUniswapV2Pair(mockPair);
            await collectGasInfo(setPairTx, "设置 Uniswap Pair");
            const transferTx = await shib.transfer(addr1.address, parseEther("10000"));
            await collectGasInfo(transferTx, "转账给 addr1（流动性池测试）");
            // 将合约地址加入白名单，避免内部转账时扣除税费
            const shibAddress = await shib.getAddress();
            const whitelistTx = await shib.updateWhitelist(shibAddress, true);
            await collectGasInfo(whitelistTx, "将合约加入白名单");
        });

        it("应该允许用户添加流动性", async function () {
            const tokenAmount = parseEther("1000");
            const ethAmount = parseEther("1");
            const currentBlock = await ethers.provider.getBlock("latest");
            const deadline = currentBlock.timestamp + 60 * 20;

            const tx = await shib.connect(addr1).addLiquidity(
                tokenAmount,
                tokenAmount * 90n / 100n,
                ethAmount * 90n / 100n,
                deadline,
                { value: ethAmount }
            );
            await expect(tx).to.emit(shib, "LiquidityAdded");
            await collectGasInfo(tx, "添加流动性");
        });

        it("Router未设置时应该回滚", async function () {
            const newShib = await ethers.getContractFactory("SHIB");
            const totalSupply = parseEther(process.env.TOKEN_TOTAL_SUPPLY || "1000000000");
            const taxRate = process.env.TAX_RATE ? parseInt(process.env.TAX_RATE) : 500;
            const newContract = await newShib.deploy(
                "Test", "TEST", totalSupply, taxRate, taxReceiver.address
            );
            await newContract.waitForDeployment();

            const tokenAmount = parseEther("1000");
            const ethAmount = parseEther("1");
            const currentBlock = await ethers.provider.getBlock("latest");
            const deadline = currentBlock.timestamp + 60 * 20;

            await expect(
                newContract.connect(addr1).addLiquidity(
                    tokenAmount, 0, 0, deadline, { value: ethAmount }
                )
            ).to.be.revertedWith("SHIB: Router not set");
        });
    });

    // 在所有测试结束后打印 Gas 汇总
    after(function () {
        printGasSummary();
    });
});

