const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * 获取 Pair 地址脚本
 * 
 * 此脚本用于查询已存在的 Uniswap Pair 地址
 * 
 * 使用方法：
 * npx hardhat run scripts/get-pair-address.js --network <network>
 * 
 * 环境变量要求：
 * - CONTRACT_ADDRESS: 代币合约地址（可选，如果设置了会从合约查询）
 * - UNISWAP_V2_ROUTER: Uniswap V2 Router 地址（必需）
 * - TOKEN_ADDRESS: 代币合约地址（如果未设置 CONTRACT_ADDRESS）
 */

/**
 * 保存 Pair 地址查询信息到文件（Markdown格式）
 * @param {Object} pairInfo Pair 地址查询信息对象
 */
function savePairAddressInfo(pairInfo) {
    try {
        // 创建部署信息目录
        const deploymentDir = path.join(process.cwd(), "deployment-version-info");
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }

        // 生成文件名：{TOKEN_SYMBOL}-get-pair-address-{时间戳}.md
        const tokenSymbol = process.env.TOKEN_SYMBOL || "SHIB";
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, -5);
        const fileName = `${tokenSymbol}-get-pair-address-${timestamp}.md`;
        const filePath = path.join(deploymentDir, fileName);

        // 生成 Markdown 内容
        const markdown = generatePairAddressMarkdown(pairInfo);
        
        // 保存为 Markdown 格式
        fs.writeFileSync(filePath, markdown, "utf8");
        
        console.log(`\nPair 地址查询信息已保存到: ${filePath}`);
        return filePath;
    } catch (error) {
        console.log(`\n警告: 保存 Pair 地址查询信息失败: ${error.message}`);
        return null;
    }
}

/**
 * 生成 Markdown 格式的 Pair 地址查询信息
 * @param {Object} pairInfo Pair 地址查询信息对象
 * @returns {string} Markdown 格式的字符串
 */
function generatePairAddressMarkdown(pairInfo) {
    const { query, network, contract, factory, pair, links, instructions } = pairInfo;
    
    let md = `# Pair 地址查询信息\n\n`;
    md += `**查询时间**: ${query.startTime} - ${query.endTime}\n\n`;
    md += `---\n\n`;
    
    // 查询信息
    md += `## 查询信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 网络名称 | ${network.name || `Chain ID: ${network.chainId}`} |\n`;
    md += `| Chain ID | ${network.chainId} |\n`;
    md += `| 查询时间 | ${query.startTime} |\n`;
    md += `| 结束时间 | ${query.endTime} |\n\n`;
    
    // 网络信息
    md += `## 网络信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 网络名称 | ${network.name || '未知'} |\n`;
    md += `| Chain ID | ${network.chainId} |\n`;
    if (network.router) {
        md += `| Router 地址 | \`${network.router}\` |\n`;
    }
    md += `\n`;
    
    // 合约信息
    md += `## 合约信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 代币地址 | \`${contract.address}\` |\n`;
    if (contract.name) {
        md += `| 代币名称 | ${contract.name} |\n`;
    }
    if (contract.symbol) {
        md += `| 代币符号 | ${contract.symbol} |\n`;
    }
    md += `\n`;
    
    // Factory 信息
    md += `## Factory 信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| Factory 地址 | \`${factory.address}\` |\n`;
    md += `| WETH 地址 | \`${factory.weth}\` |\n`;
    md += `\n`;
    
    // Pair 信息
    md += `## Pair 信息\n\n`;
    if (pair.found) {
        md += `| 项目 | 值 |\n`;
        md += `|------|-----|\n`;
        md += `| Pair 地址 | \`${pair.address}\` |\n`;
        md += `| 查询方法 | ${pair.method} |\n`;
        if (pair.reserve0 !== null) {
            md += `| 储备量0 (Reserve0) | ${pair.reserve0} |\n`;
        }
        if (pair.reserve1 !== null) {
            md += `| 储备量1 (Reserve1) | ${pair.reserve1} |\n`;
        }
        if (pair.totalSupply !== null) {
            md += `| LP 代币总供应量 | ${pair.totalSupply} |\n`;
        }
        md += `| 流动性状态 | ${pair.hasLiquidity ? '有流动性' : '无流动性'} |\n`;
        if (pair.contractPairAddress) {
            md += `| 合约中记录的 Pair | \`${pair.contractPairAddress}\` |\n`;
            if (pair.addressMatch === true) {
                md += `| 地址一致性 | 一致 |\n`;
            } else if (pair.addressMatch === false) {
                md += `| 地址一致性 | 不一致 |\n`;
            }
        }
        md += `\n`;
    } else {
        md += `**状态**: Pair 地址不存在\n\n`;
        md += `**说明**: 该代币尚未创建交易对\n\n`;
    }
    
    // 链接信息
    md += `## 链接信息\n\n`;
    if (links.pairEtherscan) {
        md += `- **Pair Etherscan**: [查看交易对](${links.pairEtherscan})\n`;
    }
    if (links.contractEtherscan) {
        md += `- **合约 Etherscan**: [查看合约](${links.contractEtherscan})\n`;
    }
    if (links.factoryEtherscan) {
        md += `- **Factory Etherscan**: [查看 Factory](${links.factoryEtherscan})\n`;
    }
    if (!links.pairEtherscan && !links.contractEtherscan && !links.factoryEtherscan) {
        md += `- **Etherscan**: 本地网络，无 Etherscan 链接\n`;
    }
    md += `\n`;
    
    // 使用说明
    if (instructions && instructions.length > 0) {
        md += `## 使用说明\n\n`;
        instructions.forEach((instruction, index) => {
            md += `${index + 1}. ${instruction}\n`;
        });
        md += `\n`;
    }
    
    // 快速访问
    md += `---\n\n`;
    md += `## 快速访问\n\n`;
    md += `- 代币地址: \`${contract.address}\`\n`;
    if (pair.found && pair.address) {
        md += `- Pair 地址: \`${pair.address}\`\n`;
    }
    if (contract.symbol) {
        md += `- 代币符号: **${contract.symbol}**\n`;
    }
    md += `\n`;
    
    // 备注
    md += `---\n\n`;
    md += `*此文件由 Pair 地址查询脚本自动生成*\n`;
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
    // 记录查询开始时间
    const queryStartTime = new Date().toISOString();
    
    console.log("=".repeat(80));
    console.log("获取 Pair 地址脚本");
    console.log("=".repeat(80));
    console.log("");

    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    const networkName = hre.network.name || network.name || "";
    
    // 用于收集信息的变量
    let factoryAddress = null;
    let wethAddress = null;
    let pairAddress = null;
    let contractPairAddress = null;
    let pairReserves = null;
    let pairTotalSupply = null;
    let pairFound = false;
    let pairMethod = "";
    let addressMatch = null;
    let contractName = null;
    let contractSymbol = null;

    // 从环境变量读取配置
    const tokenAddress = process.env.CONTRACT_ADDRESS || process.env.TOKEN_ADDRESS;
    const routerAddress = process.env.UNISWAP_V2_ROUTER;

    if (!routerAddress) {
        console.error("错误: 请在 .env 文件中设置 UNISWAP_V2_ROUTER");
        console.error("   主网: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
        console.error("   Sepolia: 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008");
        process.exit(1);
    }

    if (!tokenAddress) {
        console.error("错误: 请在 .env 文件中设置 CONTRACT_ADDRESS 或 TOKEN_ADDRESS");
        process.exit(1);
    }

    console.log("配置信息:");
    console.log("  网络:", networkName || `Chain ID: ${chainId}`);
    console.log("  代币地址:", tokenAddress);
    console.log("  Router 地址:", routerAddress);
    console.log("");

    try {
        // 方法1：从 Uniswap Factory 查询
        console.log("方法1: 从 Uniswap Factory 查询 Pair 地址");
        console.log("-".repeat(80));

        // 获取 Router 合约实例
        const routerABI = [
            "function factory() external view returns (address)",
            "function WETH() external view returns (address)"
        ];
        const router = await ethers.getContractAt(routerABI, routerAddress);

        // 获取 Factory 地址
        factoryAddress = await router.factory();
        console.log("Factory 地址:", factoryAddress);

        // 获取 WETH 地址
        wethAddress = await router.WETH();
        console.log("WETH 地址:", wethAddress);
        console.log("");

        // 获取 Factory 合约实例
        const factoryABI = [
            "function getPair(address tokenA, address tokenB) external view returns (address pair)"
        ];
        const factory = await ethers.getContractAt(factoryABI, factoryAddress);

        // 查询 Pair 地址
        pairAddress = await factory.getPair(tokenAddress, wethAddress);
        pairMethod = "从 Uniswap Factory 查询";

        if (pairAddress && pairAddress !== ethers.ZeroAddress) {
            pairFound = true;
            console.log("Pair 地址已找到:", pairAddress);
            
            const pairEtherscanUrl = getEtherscanUrl(pairAddress, chainId, networkName);
            if (pairEtherscanUrl) {
                console.log("   Pair Etherscan:", pairEtherscanUrl);
            }

            // 检查 Pair 合约是否有流动性
            try {
                const pairABI = [
                    "function token0() external view returns (address)",
                    "function token1() external view returns (address)",
                    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
                    "function totalSupply() external view returns (uint256)"
                ];
                const pair = await ethers.getContractAt(pairABI, pairAddress);
                
                const reserves = await pair.getReserves();
                const totalSupply = await pair.totalSupply();
                
                pairReserves = {
                    reserve0: ethers.formatEther(reserves[0]),
                    reserve1: ethers.formatEther(reserves[1])
                };
                pairTotalSupply = ethers.formatEther(totalSupply);
                
                console.log("");
                console.log("Pair 信息:");
                console.log("  储备量0 (Reserve0):", pairReserves.reserve0);
                console.log("  储备量1 (Reserve1):", pairReserves.reserve1);
                console.log("  LP 代币总供应量:", pairTotalSupply);
                
                if (reserves[0] === 0n && reserves[1] === 0n) {
                    console.log("    警告: Pair 中没有流动性");
                } else {
                    console.log("   Pair 中有流动性");
                }
            } catch (error) {
                console.log("    无法查询 Pair 详细信息:", error.message);
            }

        } else {
            console.log(" Pair 地址不存在");
            console.log("");
            console.log("说明:");
            console.log("  该代币尚未创建交易对");
            console.log("  可以使用以下方法创建:");
            console.log("  1.运行初始化流动性脚本: npm run init-liquidity:sepolia");
            console.log("  2.调用合约函数: shib.createOrGetPair()");
            console.log("  3.在部署时设置 AUTO_CREATE_PAIR=true");
        }

        console.log("");
        console.log("-".repeat(80));

        // 方法2：如果代币合约已部署，从合约查询
        if (tokenAddress) {
            console.log("方法2: 从代币合约查询 Pair 地址");
            console.log("-".repeat(80));

            try {
                const shibABI = [
                    "function uniswapV2Pair() external view returns (address)",
                    "function name() external view returns (string)",
                    "function symbol() external view returns (string)"
                ];
                const shib = await ethers.getContractAt(shibABI, tokenAddress);
                
                // 尝试获取代币名称和符号
                try {
                    contractName = await shib.name();
                    contractSymbol = await shib.symbol();
                } catch (error) {
                    // 忽略错误，可能不是 SHIB 合约
                }
                
                contractPairAddress = await shib.uniswapV2Pair();

                if (contractPairAddress && contractPairAddress !== ethers.ZeroAddress) {
                    console.log("合约中记录的 Pair 地址:", contractPairAddress);
                    
                    if (pairAddress && pairAddress === contractPairAddress) {
                        console.log("与 Factory 查询的地址一致");
                        addressMatch = true;
                    } else if (pairAddress && pairAddress !== contractPairAddress) {
                        console.log("    警告: 与 Factory 查询的地址不一致");
                        console.log("  Factory 查询:", pairAddress);
                        console.log("  合约记录:", contractPairAddress);
                        addressMatch = false;
                    }
                } else {
                    console.log("  合约中未记录 Pair 地址");
                    console.log("  说明: 合约尚未设置 Pair 地址");
                }
            } catch (error) {
                console.log("  无法从合约查询:", error.message);
                console.log("  可能原因: 合约地址不正确或合约未部署");
            }

            console.log("");
            console.log("-".repeat(80));
        }

        // 输出使用说明
        console.log("使用说明:");
        console.log("=".repeat(80));
        
        if (pairAddress && pairAddress !== ethers.ZeroAddress) {
            console.log("如果需要在合约中手动设置 Pair 地址，可以使用:");
            console.log("");
            console.log("方法1: 通过 Hardhat Console");
            console.log("  npx hardhat console --network sepolia");
            console.log("  const shib = await ethers.getContractAt('SHIB', '" + tokenAddress + "');");
            console.log("  await shib.setUniswapV2Pair('" + pairAddress + "');");
            console.log("");
            console.log("方法2: 创建脚本");
            console.log("  创建一个脚本调用 setUniswapV2Pair('" + pairAddress + "')");
            console.log("");
            console.log("方法3: 通过 Etherscan");
            console.log("  1. 访问合约页面");
            const contractEtherscanUrl = getEtherscanUrl(tokenAddress, chainId, networkName);
            if (contractEtherscanUrl) {
                console.log("     " + contractEtherscanUrl);
            }
            console.log("  2. 连接钱包");
            console.log("  3. 调用 setUniswapV2Pair 函数");
            console.log("  4. 输入参数: " + pairAddress);
        } else {
            console.log("Pair 尚未创建，建议使用自动创建方式:");
            console.log("  1. 运行初始化流动性脚本: npm run init-liquidity:sepolia");
            console.log("  2. 或在部署时设置 AUTO_CREATE_PAIR=true");
        }

        console.log("");

        // 收集 Pair 地址查询信息
        const pairInfo = {
            query: {
                startTime: queryStartTime,
                endTime: new Date().toISOString()
            },
            network: {
                name: networkName,
                chainId: chainId,
                router: routerAddress
            },
            contract: {
                address: tokenAddress,
                name: contractName,
                symbol: contractSymbol
            },
            factory: {
                address: factoryAddress,
                weth: wethAddress
            },
            pair: {
                found: pairFound,
                address: pairAddress || null,
                method: pairMethod || "未查询",
                reserve0: pairReserves ? pairReserves.reserve0 : null,
                reserve1: pairReserves ? pairReserves.reserve1 : null,
                totalSupply: pairTotalSupply,
                hasLiquidity: pairReserves ? (pairReserves.reserve0 !== "0.0" || pairReserves.reserve1 !== "0.0") : false,
                contractPairAddress: contractPairAddress || null,
                addressMatch: addressMatch
            },
            links: {
                pairEtherscan: pairAddress ? getEtherscanUrl(pairAddress, chainId, networkName) : null,
                contractEtherscan: getEtherscanUrl(tokenAddress, chainId, networkName) || null,
                factoryEtherscan: factoryAddress ? getEtherscanUrl(factoryAddress, chainId, networkName) : null
            },
            instructions: []
        };
        
        // 添加使用说明
        if (pairFound && pairAddress) {
            pairInfo.instructions.push(
                "如果需要在合约中手动设置 Pair 地址，可以使用以下方法:",
                `通过 Hardhat Console: npx hardhat console --network ${networkName}`,
                `创建脚本调用 setUniswapV2Pair('${pairAddress}')`,
                `通过 Etherscan 调用 setUniswapV2Pair 函数，参数: ${pairAddress}`
            );
        } else {
            pairInfo.instructions.push(
                "Pair 尚未创建，建议使用自动创建方式:",
                `运行初始化流动性脚本: npm run init-liquidity:${networkName}`,
                "或在部署时设置 AUTO_CREATE_PAIR=true"
            );
        }
        
        // 保存 Pair 地址查询信息到文件
        savePairAddressInfo(pairInfo);

    } catch (error) {
        console.error("错误:", error.message);
        if (error.reason) {
            console.error("原因:", error.reason);
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

