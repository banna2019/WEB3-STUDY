const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * 初始化流动性脚本
 * 
 * 此脚本用于：
 * 1. 创建交易对（如果尚未创建）
 * 2. 添加初始流动性，使代币在 Uniswap 上可见
 * 
 * 使用方法：
 * npx hardhat run scripts/init-liquidity.js --network <network>
 * 
 * 环境变量要求：
 * - CONTRACT_ADDRESS: 已部署的代币合约地址
 * - INITIAL_TOKEN_AMOUNT: 初始代币数量（单位：代币数量，不是wei）
 * - INITIAL_ETH_AMOUNT: 初始ETH数量（单位：ETH，不是wei）
 * - UNISWAP_V2_ROUTER: Uniswap V2 Router 地址（如果未设置，会从合约中读取）
 */

/**
 * 保存流动性初始化信息到文件（Markdown格式）
 * @param {Object} liquidityInfo 流动性初始化信息对象
 */
function saveLiquidityInfo(liquidityInfo) {
    try {
        // 创建部署信息目录
        const deploymentDir = path.join(process.cwd(), "deployment-version-info");
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }

        // 生成文件名：{TOKEN_SYMBOL}-init-liquidity-{时间戳}.md
        const tokenSymbol = process.env.TOKEN_SYMBOL || "SHIB";
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, -5);
        const fileName = `${tokenSymbol}-init-liquidity-${timestamp}.md`;
        const filePath = path.join(deploymentDir, fileName);

        // 生成 Markdown 内容
        const markdown = generateLiquidityMarkdown(liquidityInfo);
        
        // 保存为 Markdown 格式
        fs.writeFileSync(filePath, markdown, "utf8");
        
        console.log(`\n流动性初始化信息已保存到: ${filePath}`);
        return filePath;
    } catch (error) {
        console.log(`\n警告: 保存流动性初始化信息失败: ${error.message}`);
        return null;
    }
}

/**
 * 生成 Markdown 格式的流动性初始化信息
 * @param {Object} liquidityInfo 流动性初始化信息对象
 * @returns {string} Markdown 格式的字符串
 */
function generateLiquidityMarkdown(liquidityInfo) {
    const { initialization, contract, network, liquidity, transaction, links, tips } = liquidityInfo;
    
    let md = `# 流动性初始化信息\n\n`;
    md += `**初始化时间**: ${initialization.startTime} - ${initialization.endTime}\n\n`;
    md += `---\n\n`;
    
    // 初始化信息
    md += `## 初始化信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 网络名称 | ${network.name || `Chain ID: ${network.chainId}`} |\n`;
    md += `| Chain ID | ${network.chainId} |\n`;
    md += `| 操作账户 | \`${initialization.operator}\` |\n`;
    md += `| 账户余额 | ${initialization.balance} |\n`;
    md += `| 开始时间 | ${initialization.startTime} |\n`;
    md += `| 结束时间 | ${initialization.endTime} |\n\n`;
    
    // 合约信息
    md += `## 合约信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 合约地址 | \`${contract.address}\` |\n`;
    md += `| 代币名称 | ${contract.name} |\n`;
    md += `| 代币符号 | ${contract.symbol} |\n`;
    md += `| 总供应量 | ${contract.totalSupply} |\n\n`;
    
    // 网络信息
    md += `## 网络信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 网络名称 | ${network.name || '未知'} |\n`;
    md += `| Chain ID | ${network.chainId} |\n`;
    if (network.router) {
        md += `| Router 地址 | \`${network.router}\` |\n`;
    }
    if (network.pair) {
        md += `| Pair 地址 | \`${network.pair}\` |\n`;
    }
    md += `\n`;
    
    // 流动性信息
    md += `## 流动性信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 初始代币数量 | ${liquidity.tokenAmount} |\n`;
    md += `| 初始ETH数量 | ${liquidity.ethAmount} |\n`;
    md += `| 滑点保护 | ${liquidity.slippage}% |\n`;
    md += `| 最小代币数量 | ${liquidity.amountTokenMin} |\n`;
    md += `| 最小ETH数量 | ${liquidity.amountETHMin} |\n`;
    if (liquidity.pairCreated) {
        md += `| 交易对状态 | 已创建 |\n`;
    } else {
        md += `| 交易对状态 | 已存在 |\n`;
    }
    md += `\n`;
    
    // 交易信息
    md += `## 交易信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 交易哈希 | \`${transaction.hash}\` |\n`;
    md += `| 区块号 | ${transaction.blockNumber} |\n`;
    md += `| Gas 消耗 | ${transaction.gasUsed} |\n`;
    md += `| 交易截止时间 | ${transaction.deadline} |\n`;
    md += `\n`;
    
    // 链接信息
    md += `## 链接信息\n\n`;
    if (links.pairEtherscan) {
        md += `- **Pair Etherscan**: [查看交易对](${links.pairEtherscan})\n`;
    }
    if (links.contractEtherscan) {
        md += `- **合约 Etherscan**: [查看合约](${links.contractEtherscan})\n`;
    }
    if (links.uniswap) {
        md += `- **Uniswap 交易**: [开始交易](${links.uniswap})\n`;
    }
    if (!links.pairEtherscan && !links.contractEtherscan && !links.uniswap) {
        md += `- **Etherscan**: 本地网络，无 Etherscan 链接\n`;
    }
    md += `\n`;
    
    // 重要提示
    if (tips && tips.length > 0) {
        md += `## 重要提示\n\n`;
        tips.forEach((tip, index) => {
            md += `${index + 1}. ${tip}\n`;
        });
        md += `\n`;
    }
    
    // 快速访问
    md += `---\n\n`;
    md += `## 快速访问\n\n`;
    md += `- 合约地址: \`${contract.address}\`\n`;
    if (network.pair) {
        md += `- Pair 地址: \`${network.pair}\`\n`;
    }
    md += `- 代币符号: **${contract.symbol}**\n`;
    if (links.uniswap) {
        md += `- [在 Uniswap 上交易](${links.uniswap})\n`;
    }
    md += `\n`;
    
    // 备注
    md += `---\n\n`;
    md += `*此文件由流动性初始化脚本自动生成*\n`;
    md += `*生成时间: ${new Date().toISOString()}*\n`;
    
    return md;
}

/**
 * 根据网络信息获取 Etherscan 链接
 */
function getEtherscanUrl(address, chainId, networkName) {
    const networkMap = {
        1: "https://etherscan.io",
        11155111: "https://sepolia.etherscan.io",
        5: "https://goerli.etherscan.io",
        42161: "https://arbiscan.io",
        10: "https://optimistic.etherscan.io",
        137: "https://polygonscan.com",
        56: "https://bscscan.com",
        43114: "https://snowtrace.io",
    };

    const nameMap = {
        mainnet: "https://etherscan.io",
        sepolia: "https://sepolia.etherscan.io",
        goerli: "https://goerli.etherscan.io",
        arbitrum: "https://arbiscan.io",
        optimism: "https://optimistic.etherscan.io",
        polygon: "https://polygonscan.com",
        bsc: "https://bscscan.com",
        avalanche: "https://snowtrace.io",
    };

    let baseUrl = "";
    
    if (networkName && nameMap[networkName.toLowerCase()]) {
        baseUrl = nameMap[networkName.toLowerCase()];
    } else if (chainId && networkMap[chainId]) {
        baseUrl = networkMap[chainId];
    }
    
    if (!baseUrl || networkName === "localhost" || networkName === "hardhat") {
        return "";
    }

    return `${baseUrl}/address/${address}`;
}

async function main() {
    // 记录初始化开始时间
    const initializationStartTime = new Date().toISOString();
    
    console.log("=".repeat(80));
    console.log("初始化流动性脚本");
    console.log("=".repeat(80));
    console.log("");

    // 从环境变量读取配置
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        console.error("错误: 请在 .env 文件中设置 CONTRACT_ADDRESS");
        console.error("   示例: CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890");
        process.exit(1);
    }

    const initialTokenAmountStr = process.env.INITIAL_TOKEN_AMOUNT || "1000000";
    const initialETHAmountStr = process.env.INITIAL_ETH_AMOUNT || "1";

    console.log("配置信息:");
    console.log("  合约地址:", contractAddress);
    console.log("  初始代币数量:", initialTokenAmountStr);
    console.log("  初始ETH数量:", initialETHAmountStr);
    console.log("");

    // 获取部署者账户
    const [deployer] = await ethers.getSigners();
    console.log("操作账户:", deployer.address);
    
    // 获取账户余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("账户余额:", ethers.formatEther(balance), "ETH");
    
    // 检查余额是否足够
    const initialETHAmount = ethers.parseEther(initialETHAmountStr);
    if (balance < initialETHAmount + ethers.parseEther("0.01")) {
        console.error("\n错误: 账户余额不足");
        console.error(`  需要至少: ${ethers.formatEther(initialETHAmount + ethers.parseEther("0.01"))} ETH`);
        console.error(`  当前余额: ${ethers.formatEther(balance)} ETH`);
        process.exit(1);
    }
    console.log("");

    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    const networkName = hre.network.name || network.name || "";

    // 连接合约
    console.log("连接合约...");
    const SHIB = await ethers.getContractFactory("SHIB");
    const shib = await SHIB.attach(contractAddress);
    
    // 验证合约并保存信息（用于后续生成 Markdown）
    let name, symbol, totalSupply;
    try {
        name = await shib.name();
        symbol = await shib.symbol();
        totalSupply = await shib.totalSupply();
        console.log("合约信息:");
        console.log("  名称:", name);
        console.log("  符号:", symbol);
        console.log("  总供应量:", ethers.formatEther(totalSupply));
        console.log("");
    } catch (error) {
        console.error("错误: 无法连接到合约，请检查合约地址是否正确");
        console.error("   错误信息:", error.message);
        process.exit(1);
    }

    // 检查 Router 是否已设置
    let routerAddress = process.env.UNISWAP_V2_ROUTER;
    try {
        const currentRouter = await shib.uniswapV2Router();
        if (currentRouter && currentRouter !== ethers.ZeroAddress) {
            routerAddress = currentRouter;
            console.log("Router已设置:", routerAddress);
        } else if (routerAddress) {
            console.log("设置Router...");
            const tx = await shib.setUniswapV2Router(routerAddress);
            await tx.wait();
            console.log("Router设置成功:", routerAddress);
        } else {
            console.error("错误: 未设置 Router");
            console.error("   请在 .env 文件中设置 UNISWAP_V2_ROUTER");
            console.error("   或先调用: shib.setUniswapV2Router(routerAddress)");
            process.exit(1);
        }
    } catch (error) {
        console.error("错误: Router 设置失败");
        console.error("   错误信息:", error.message);
        process.exit(1);
    }
    console.log("");

    // 检查交易对是否已创建
    let pairAddress;
    let pairCreated = false;
    try {
        pairAddress = await shib.uniswapV2Pair();
        if (pairAddress && pairAddress !== ethers.ZeroAddress) {
            console.log("交易对已存在:", pairAddress);
            const pairEtherscanUrl = getEtherscanUrl(pairAddress, chainId, networkName);
            if (pairEtherscanUrl) {
                console.log("  Pair Etherscan:", pairEtherscanUrl);
            }
            pairCreated = false; // 已存在，不是新创建的
        } else {
            console.log("创建交易对...");
            const tx = await shib.createOrGetPair();
            const receipt = await tx.wait();
            pairAddress = await shib.uniswapV2Pair();
            console.log("交易对创建成功:", pairAddress);
            const pairEtherscanUrl = getEtherscanUrl(pairAddress, chainId, networkName);
            if (pairEtherscanUrl) {
                console.log("  Pair Etherscan:", pairEtherscanUrl);
            }
            pairCreated = true; // 新创建的
        }
    } catch (error) {
        console.error("错误: 交易对创建失败");
        console.error("   错误信息:", error.message);
        process.exit(1);
    }
    console.log("");

    // 检查代币余额
    const initialTokenAmount = ethers.parseEther(initialTokenAmountStr);
    const deployerBalance = await shib.balanceOf(deployer.address);
    console.log("代币余额:", ethers.formatEther(deployerBalance));
    
    if (deployerBalance < initialTokenAmount) {
        console.error("错误: 代币余额不足");
        console.error(`  需要: ${initialTokenAmountStr} 代币`);
        console.error(`  当前: ${ethers.formatEther(deployerBalance)} 代币`);
        process.exit(1);
    }
    console.log("");

    // 授权合约使用代币
    console.log("授权合约使用代币...");
    try {
        const allowance = await shib.allowance(deployer.address, contractAddress);
        if (allowance < initialTokenAmount) {
            const approveTx = await shib.approve(contractAddress, initialTokenAmount);
            await approveTx.wait();
            console.log("授权成功");
        } else {
            console.log("已授权，跳过");
        }
    } catch (error) {
        console.error("错误: 授权失败");
        console.error("   错误信息:", error.message);
        process.exit(1);
    }
    console.log("");

    // 添加流动性
    console.log("添加初始流动性...");
    console.log("  代币数量:", initialTokenAmountStr);
    console.log("  ETH数量:", initialETHAmountStr);
    console.log("");

    try {
        const currentBlock = await ethers.provider.getBlock("latest");
        const deadline = currentBlock.timestamp + 60 * 20; // 20分钟后过期

        // 设置滑点保护（5%）
        const amountTokenMin = initialTokenAmount * 95n / 100n;
        const amountETHMin = initialETHAmount * 95n / 100n;

        console.log("滑点保护:");
        console.log("  最小代币数量:", ethers.formatEther(amountTokenMin));
        console.log("  最小ETH数量:", ethers.formatEther(amountETHMin));
        console.log("");

        const tx = await shib.addLiquidity(
            initialTokenAmount,
            amountTokenMin,
            amountETHMin,
            deadline,
            { value: initialETHAmount }
        );

        console.log("交易已发送，等待确认...");
        const receipt = await tx.wait();
        console.log("交易确认，区块号:", receipt.blockNumber);
        console.log("Gas 消耗:", receipt.gasUsed.toString());
        console.log("");

        // 获取交易对信息
        const pairEtherscanUrl = getEtherscanUrl(pairAddress, chainId, networkName);
        if (pairEtherscanUrl) {
            console.log("交易对 Etherscan:", pairEtherscanUrl);
        }

        // 获取 Uniswap 链接
        const uniswapUrl = `https://app.uniswap.org/#/swap?inputCurrency=${contractAddress}`;
        console.log("Uniswap 交易链接:", uniswapUrl);
        console.log("");

        console.log("=".repeat(80));
        console.log("流动性初始化完成!");
        console.log("=".repeat(80));
        console.log("");
        console.log("重要提示:");
        console.log(" 1.代币现在应该在 Uniswap 上可见");
        console.log(" 2.如果仍然搜索不到，请等待几分钟让索引更新");
        console.log(" 3.可以通过合约地址直接访问: " + uniswapUrl);
        console.log(" 4.建议进行一些交易以增加代币的可见性");
        console.log("");

        // 收集流动性初始化信息
        const liquidityInfo = {
            initialization: {
                startTime: initializationStartTime,
                endTime: new Date().toISOString(),
                operator: deployer.address,
                balance: ethers.formatEther(balance) + " ETH"
            },
            contract: {
                address: contractAddress,
                name: name,
                symbol: symbol,
                totalSupply: ethers.formatEther(totalSupply)
            },
            network: {
                name: networkName,
                chainId: chainId,
                router: routerAddress,
                pair: pairAddress
            },
            liquidity: {
                tokenAmount: initialTokenAmountStr,
                ethAmount: initialETHAmountStr,
                slippage: "5",
                amountTokenMin: ethers.formatEther(amountTokenMin),
                amountETHMin: ethers.formatEther(amountETHMin),
                pairCreated: pairCreated
            },
            transaction: {
                hash: receipt.hash,
                blockNumber: receipt.blockNumber.toString(),
                gasUsed: receipt.gasUsed.toString(),
                deadline: new Date(deadline * 1000).toISOString()
            },
            links: {
                pairEtherscan: pairEtherscanUrl || null,
                contractEtherscan: getEtherscanUrl(contractAddress, chainId, networkName) || null,
                uniswap: uniswapUrl || null
            },
            tips: [
                "代币现在应该在 Uniswap 上可见",
                "如果仍然搜索不到，请等待几分钟让索引更新",
                `可以通过合约地址直接访问: ${uniswapUrl}`,
                "建议进行一些交易以增加代币的可见性"
            ]
        };
        
        // 保存流动性初始化信息到文件
        saveLiquidityInfo(liquidityInfo);

    } catch (error) {
        console.error("错误: 添加流动性失败");
        console.error("   错误信息:", error.message);
        if (error.reason) {
            console.error("   原因:", error.reason);
        }
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

