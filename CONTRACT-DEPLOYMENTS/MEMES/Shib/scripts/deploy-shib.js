const { ethers } = require("hardhat");
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * SHIB代币合约部署脚本
 * 
 * 使用方法：
 * 1. 配置.env文件中的参数
 * 2. 运行: npx hardhat run scripts/deploy-shib.js --network <network>
 * 
 * 示例：
 * - 本地网络: npx hardhat run scripts/deploy-shib.js --network localhost
 * - Sepolia测试网: npx hardhat run scripts/deploy-shib.js --network sepolia
 * - 主网: npx hardhat run scripts/deploy-shib.js --network mainnet
 */

/**
 * 根据网络信息获取 Etherscan 链接
 * @param {string} address 合约地址
 * @param {number} chainId 链ID
 * @param {string} networkName 网络名称
 * @returns {string} Etherscan 链接
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

    // 优先使用网络名称匹配
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
    
    // 先尝试通过网络名称匹配
    if (networkName && nameMap[networkName.toLowerCase()]) {
        baseUrl = nameMap[networkName.toLowerCase()];
    } 
    // 再尝试通过 chainId 匹配
    else if (chainId && networkMap[chainId]) {
        baseUrl = networkMap[chainId];
    }
    
    // 如果是本地网络或未匹配的网络，返回空字符串
    if (!baseUrl || networkName === "localhost" || networkName === "hardhat") {
        return "";
    }

    return `${baseUrl}/address/${address}`;
}

/**
 * 更新 .env 文件中的环境变量
 * @param {string} key 环境变量键名
 * @param {string} value 环境变量值
 */
function updateEnvFile(key, value) {
    try {
        const envPath = path.join(process.cwd(), ".env");
        
        // 如果 .env 文件不存在，从 .env.example 复制
        if (!fs.existsSync(envPath)) {
            const envExamplePath = path.join(process.cwd(), ".env.example");
            if (fs.existsSync(envExamplePath)) {
                fs.copyFileSync(envExamplePath, envPath);
                console.log("已从 .env.example 创建 .env 文件");
            } else {
                // 如果 .env.example 也不存在，创建新的 .env 文件
                fs.writeFileSync(envPath, `${key}=${value}\n`, "utf8");
                return;
            }
        }
        
        // 读取 .env 文件内容
        let envContent = fs.readFileSync(envPath, "utf8");
        
        // 检查键是否存在
        const keyRegex = new RegExp(`^${key}=.*$`, "m");
        
        if (keyRegex.test(envContent)) {
            // 如果键存在，替换值
            envContent = envContent.replace(keyRegex, `${key}=${value}`);
        } else {
            // 如果键不存在，追加到文件末尾
            envContent += `\n${key}=${value}\n`;
        }
        
        // 写回文件
        fs.writeFileSync(envPath, envContent, "utf8");
        console.log(`已更新 .env 文件: ${key}=${value}`);
    } catch (error) {
        console.log(`警告: 更新 .env 文件失败 (${key}): ${error.message}`);
    }
}

/**
 * 保存部署信息到文件（Markdown格式）
 * @param {Object} deploymentInfo 部署信息对象
 */
function saveDeploymentInfo(deploymentInfo) {
    try {
        // 创建部署信息目录
        const symbol = process.env.TOKEN_SYMBOL
        const deploymentDir = path.join(process.cwd(), "deployment-version-info");
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }

        // 生成文件名：deployment-<timestamp>.md
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, -5);
        const fileName = `${symbol}-deployment-${timestamp}.md`;
        const filePath = path.join(deploymentDir, fileName);

        // 生成 Markdown 内容
        const markdown = generateMarkdown(deploymentInfo);
        
        // 保存为 Markdown 格式
        fs.writeFileSync(filePath, markdown, "utf8");
        
        console.log(`\n部署信息已保存到: ${filePath}`);
        return filePath;
    } catch (error) {
        console.log(`\n警告: 保存部署信息失败: ${error.message}`);
        return null;
    }
}

/**
 * 生成 Markdown 格式的部署信息
 * @param {Object} deploymentInfo 部署信息对象
 * @returns {string} Markdown 格式的字符串
 */
function generateMarkdown(deploymentInfo) {
    const { deployment, contract, deploymentParams, links, verification, uniswap, nextSteps } = deploymentInfo;
    
    let md = `# 合约部署信息\n\n`;
    md += `**部署时间**: ${deployment.startTime} - ${deployment.endTime}\n\n`;
    md += `---\n\n`;
    
    // 部署信息
    md += `## 部署信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 网络名称 | ${deployment.network} |\n`;
    md += `| Chain ID | ${deployment.chainId} |\n`;
    md += `| 部署者地址 | \`${deployment.deployer}\` |\n`;
    md += `| 部署者余额 | ${deployment.deployerBalance} |\n`;
    md += `| 开始时间 | ${deployment.startTime} |\n`;
    md += `| 结束时间 | ${deployment.endTime} |\n\n`;
    
    // 合约信息
    md += `## 合约信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 合约地址 | \`${contract.address}\` |\n`;
    md += `| 代币名称 | ${contract.name} |\n`;
    md += `| 代币符号 | ${contract.symbol} |\n`;
    md += `| 总供应量 | ${contract.totalSupply} |\n`;
    md += `| 税率 | ${contract.taxRate} 基点 (${contract.taxRatePercent}) |\n`;
    md += `| 税收接收地址 | \`${contract.taxReceiver}\` |\n`;
    md += `| 税收是否启用 | ${contract.taxEnabled ? '是' : '否'} |\n\n`;
    
    // 部署参数
    md += `## 部署参数\n\n`;
    md += `| 参数 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 代币名称 | ${deploymentParams.name} |\n`;
    md += `| 代币符号 | ${deploymentParams.symbol} |\n`;
    md += `| 总供应量 | ${deploymentParams.totalSupply} |\n`;
    md += `| 税率 | ${deploymentParams.taxRate} 基点 |\n`;
    md += `| 税收接收地址 | \`${deploymentParams.taxReceiver}\` |\n\n`;
    
    // 链接信息
    md += `## 链接信息\n\n`;
    if (links.etherscan) {
        md += `- **Etherscan**: [查看合约](${links.etherscan})\n\n`;
    } else {
        md += `- **Etherscan**: 本地网络，无 Etherscan 链接\n\n`;
    }
    
    // 验证信息
    md += `## 验证信息\n\n`;
    md += `| 项目 | 值 |\n`;
    md += `|------|-----|\n`;
    md += `| 自动验证 | ${verification.autoVerify ? '是' : '否'} |\n`;
    md += `| 验证状态 | ${verification.verified ? '已验证' : '未验证'} |\n`;
    if (verification.verifyCommand) {
        md += `\n**验证命令**:\n\n\`\`\`bash\n${verification.verifyCommand}\n\`\`\`\n\n`;
    }
    
    // Uniswap 信息
    md += `## Uniswap 信息\n\n`;
    md += `| 项目 | 值 | 来源 |\n`;
    md += `|------|-----|------|\n`;
    md += `| Router 地址 | ${uniswap.router ? `\`${uniswap.router}\`` : '未设置'} | ${uniswap.router ? '.env 文件' : '-'} |\n`;
    
    // Factory 地址
    const factoryDisplay = uniswap.factory ? `\`${uniswap.factory}\`` : '未设置';
    const factorySourceDisplay = uniswap.factorySource === 'manual' ? '手动设置 (.env)' : 
                                 uniswap.factorySource === 'auto' ? '自动获取 (Router)' : '-';
    md += `| Factory 地址 | ${factoryDisplay} | ${factorySourceDisplay} |\n`;
    
    // WETH 地址
    const wethDisplay = uniswap.weth ? `\`${uniswap.weth}\`` : '未设置';
    const wethSourceDisplay = uniswap.wethSource === 'env' ? '从 .env 读取' : 
                              uniswap.wethSource === 'auto' ? '自动获取 (Router) 并更新到 .env' : '-';
    md += `| WETH 地址 | ${wethDisplay} | ${wethSourceDisplay} |\n`;
    
    // Pair 地址
    const pairDisplay = uniswap.pair ? `\`${uniswap.pair}\`` : '未设置';
    const pairSourceDisplay = uniswap.pairSource === 'env' ? '从 .env 读取' : 
                              uniswap.pairSource === 'auto' ? '自动创建并更新到 .env' : '-';
    md += `| Pair 地址 | ${pairDisplay} | ${pairSourceDisplay} |\n\n`;
    
    // 环境变量更新说明
    if (uniswap.wethSource === 'auto' || uniswap.pairSource === 'auto') {
        md += `**环境变量更新**:\n\n`;
        if (uniswap.wethSource === 'auto') {
            md += `- \`UNISWAP_V2_WETH\` 已自动更新为: \`${uniswap.weth}\`\n`;
        }
        if (uniswap.pairSource === 'auto') {
            md += `- \`UNISWAP_V2_PAIR\` 已自动更新为: \`${uniswap.pair}\`\n`;
        }
        md += `\n`;
    }
    
    // 后续操作
    md += `## 后续操作\n\n`;
    nextSteps.forEach((step, index) => {
        md += `${index + 1}. ${step}\n`;
    });
    md += `\n`;
    
    // 快速访问
    md += `---\n\n`;
    md += `## 快速访问\n\n`;
    if (links.etherscan) {
        md += `- [在 Etherscan 上查看合约](${links.etherscan})\n`;
    }
    md += `- 合约地址: \`${contract.address}\`\n`;
    md += `- 代币符号: **${contract.symbol}**\n\n`;
    
    // 备注
    md += `---\n\n`;
    md += `*此文件由部署脚本自动生成*\n`;
    md += `*生成时间: ${new Date().toISOString()}*\n`;
    
    return md;
}

async function main() {
    // 记录部署开始时间
    const deploymentStartTime = new Date().toISOString();
    
    // 从.env文件读取部署参数（先读取symbol用于打印）
    const symbol = process.env.TOKEN_SYMBOL || "SHIB";
    console.log(`开始部署${symbol}代币合约...\n`);

    // 获取部署者账户
    const [deployer] = await ethers.getSigners();
    console.log("部署账户:", deployer.address);
    
    // 获取账户余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("账户余额:", ethers.formatEther(balance), "ETH\n");

    // 从.env文件读取部署参数
    const name = process.env.TOKEN_NAME || "Shiba Inu";
    const totalSupplyStr = process.env.TOKEN_TOTAL_SUPPLY || "1000000000";
    const taxRateEnv = process.env.TAX_RATE;
    const taxRate = taxRateEnv ? parseInt(taxRateEnv, 10) : 500; // 默认5%
    
    // 零地址配置：从环境变量读取，如果未设置则使用默认值
    // 零地址用于表示空地址或未初始化的地址，常用于地址验证和默认值检查
    // 标准以太坊零地址：0x0000000000000000000000000000000000000000
    // 注意：不建议修改此值，除非有特殊需求
    const ZERO_ADDRESS = process.env.ZERO_ADDRESS || "0x0000000000000000000000000000000000000000";
    
    // 处理税收接收地址：如果未设置或为零地址，则使用部署者地址
    const taxReceiverEnv = process.env.TAX_RECEIVER;
    let taxReceiver;
    if (taxReceiverEnv && taxReceiverEnv.trim() !== "" && taxReceiverEnv.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
        // 验证地址格式
        if (!ethers.isAddress(taxReceiverEnv)) {
            console.error("错误: TAX_RECEIVER 不是有效的以太坊地址");
            process.exit(1);
        }
        taxReceiver = taxReceiverEnv;
    } else {
        // 默认使用部署者地址
        taxReceiver = deployer.address;
        if (taxReceiverEnv && taxReceiverEnv.trim() !== "") {
            console.log("警告: TAX_RECEIVER 设置为零地址，已自动使用部署者地址");
        }
    }
    
    console.log("部署参数:");
    console.log("  代币名称:", name);
    console.log("  代币符号:", symbol);
    console.log("  总供应量:", totalSupplyStr);
    console.log("  税率:", taxRate, "基点 (", (taxRate / 100).toFixed(2), "%)");
    console.log("  税收接收地址:", taxReceiver);
    
    // 验证税收接收地址不是零地址
    if (taxReceiver === ZERO_ADDRESS || taxReceiver.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
        console.error("错误: 税收接收地址不能为零地址");
        process.exit(1);
    }
    console.log("");

    // 转换总供应量
    const totalSupply = ethers.parseEther(totalSupplyStr);

    // 部署合约
    console.log("正在部署合约...");
    const SHIB = await ethers.getContractFactory("SHIB");
    const shib = await SHIB.deploy(
        name,
        symbol,
        totalSupply,
        taxRate,
        taxReceiver
    );

    await shib.waitForDeployment();
    const shibAddress = await shib.getAddress();
    
    // 自动更新 .env 文件中的 CONTRACT_ADDRESS
    updateEnvFile("CONTRACT_ADDRESS", shibAddress);
    
    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    const networkName = hre.network.name || network.name || "";

    console.log("合约部署成功!");
    console.log("\n" + "─".repeat(80));
    console.log("部署信息");
    console.log("─".repeat(80));
    console.log("网络名称:", networkName || "未知");
    console.log("Chain ID:", chainId);
    console.log("合约地址:", shibAddress);
    
    // 生成并输出 Etherscan 链接
    const etherscanUrl = getEtherscanUrl(shibAddress, chainId, networkName);
    if (etherscanUrl) {
        console.log("Etherscan:", etherscanUrl);
    } else {
        console.log("网络类型: 本地网络 (无 Etherscan 链接)");
    }
    console.log("─".repeat(80));
    console.log("");

    // 验证部署参数
    console.log("验证部署参数...");
    const deployedName = await shib.name();
    const deployedSymbol = await shib.symbol();
    const deployedTotalSupply = await shib.totalSupply();
    const deployedTaxRate = await shib.taxRate();
    const deployedTaxReceiver = await shib.taxReceiver();
    const deployedTaxEnabled = await shib.taxEnabled();

    console.log("  代币名称:", deployedName);
    console.log("  代币符号:", deployedSymbol);
    console.log("  总供应量:", ethers.formatEther(deployedTotalSupply));
    console.log("  税率:", Number(deployedTaxRate), "基点");
    console.log("  税收接收地址:", deployedTaxReceiver);
    console.log("  税收是否启用:", deployedTaxEnabled);
    console.log("");

    // 如果配置了Uniswap V2 Router，自动设置
    const uniswapV2Router = process.env.UNISWAP_V2_ROUTER;
    const uniswapV2Factory = process.env.UNISWAP_V2_FACTORY;
    let pairAddress = null;
    let wethAddress = null;
    
    // 如果配置了 Factory 地址，优先手动设置
    if (uniswapV2Factory && uniswapV2Factory.trim() !== "") {
        console.log("设置Uniswap V2 Factory...");
        try {
            // 验证地址格式
            if (!ethers.isAddress(uniswapV2Factory)) {
                console.log("  警告: UNISWAP_V2_FACTORY 不是有效的以太坊地址，将跳过手动设置");
                console.log("  将使用 Router 自动获取 Factory 地址");
            } else {
                // 设置超时：30秒
                const factoryTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("设置 Factory 超时（30秒）")), 30000);
                });
                
                const factoryTxPromise = shib.setUniswapV2Factory(uniswapV2Factory);
                const factoryTx = await Promise.race([factoryTxPromise, factoryTimeoutPromise]);
                
                // 等待交易确认，设置超时：60秒
                const factoryWaitTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("等待 Factory 交易确认超时（60秒）")), 60000);
                });
                
                const factoryWaitPromise = factoryTx.wait();
                await Promise.race([factoryWaitPromise, factoryWaitTimeoutPromise]);
                
                console.log("Factory设置成功:", uniswapV2Factory);
                
                // 输出 Factory 的 Etherscan 链接
                const factoryEtherscanUrl = getEtherscanUrl(uniswapV2Factory, chainId, networkName);
                if (factoryEtherscanUrl) {
                    console.log("  Factory Etherscan:", factoryEtherscanUrl);
                }
                console.log("");
            }
        } catch (error) {
            console.log("警告: Factory 设置失败:", error.message);
            console.log("将使用 Router 自动获取 Factory 地址");
            console.log("");
        }
    }
    
    if (uniswapV2Router) {
        console.log("设置Uniswap V2 Router...");
        try {
            // 设置超时：30秒
            const routerTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("设置 Router 超时（30秒）")), 30000);
            });
            
            const routerTxPromise = shib.setUniswapV2Router(uniswapV2Router);
            const tx = await Promise.race([routerTxPromise, routerTimeoutPromise]);
            
            // 等待交易确认，设置超时：60秒
            const waitTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("等待交易确认超时（60秒）")), 60000);
            });
            
            const waitPromise = tx.wait();
            await Promise.race([waitPromise, waitTimeoutPromise]);
            
            console.log("Router设置成功:", uniswapV2Router);
            
            // 如果未手动设置 Factory，输出提示信息
            if (!uniswapV2Factory || uniswapV2Factory.trim() === "") {
                console.log("  说明: Factory 地址已通过 Router 自动获取");
            }
            
            // 查询 Factory 地址，设置超时：30秒
            try {
                const factoryTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("查询 Factory 地址超时（30秒）")), 30000);
                });
                
                const factoryPromise = shib.uniswapV2Factory();
                const factory = await Promise.race([factoryPromise, factoryTimeoutPromise]);
                console.log("  Factory地址:", factory);
                
                // 输出 Factory 的 Etherscan 链接
                const factoryEtherscanUrl = getEtherscanUrl(factory, chainId, networkName);
                if (factoryEtherscanUrl) {
                    console.log("  Factory Etherscan:", factoryEtherscanUrl);
                }
            } catch (error) {
                console.log("  警告: 获取 Factory 地址失败:", error.message);
            }
            
            // 获取 WETH 地址
            // 说明：WETH 地址通过 Router 合约的 WETH() 函数自动获取，无需手动指定
            // WETH 是 Wrapped ETH（包装的以太币），是 ETH 的 ERC20 包装版本
            // 不同网络有不同的 WETH 地址，Router 合约会自动返回对应网络的 WETH 地址
            try {
                // 设置超时：30秒
                const wethTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("获取 WETH 地址超时（30秒）")), 30000);
                });
                
                const router = await ethers.getContractAt("IUniswapV2Router02", uniswapV2Router);
                const wethPromise = router.WETH();
                wethAddress = await Promise.race([wethPromise, wethTimeoutPromise]);
                console.log("  WETH地址:", wethAddress, "(自动获取，无需手动指定)");
                
                // 自动更新 .env 文件中的 UNISWAP_V2_WETH
                if (wethAddress && wethAddress !== ethers.ZeroAddress) {
                    updateEnvFile("UNISWAP_V2_WETH", wethAddress);
                }
                
                // 输出 WETH 的 Etherscan 链接
                const wethEtherscanUrl = getEtherscanUrl(wethAddress, chainId, networkName);
                if (wethEtherscanUrl) {
                    console.log("  WETH Etherscan:", wethEtherscanUrl);
                }
            } catch (error) {
                console.log("  警告: 获取 WETH 地址失败:", error.message);
                if (error.message && error.message.includes("超时")) {
                    console.log("    原因: 网络连接超时");
                    console.log("    建议: 检查网络连接或 RPC 节点");
                }
            }
            console.log("");

            // 如果配置了自动创建交易对
            const autoCreatePair = process.env.AUTO_CREATE_PAIR === "true";
            if (autoCreatePair) {
                console.log("创建交易对...");
                let pairCreated = false;
                const maxRetries = 3;
                let retryCount = 0;
                
                while (!pairCreated && retryCount < maxRetries) {
                    try {
                        if (retryCount > 0) {
                            console.log(`  重试第 ${retryCount} 次...`);
                            // 等待一段时间再重试
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                        
                        // 设置超时：30秒
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error("操作超时（30秒）")), 30000);
                        });
                        
                        const pairTxPromise = shib.createOrGetPair();
                        const pairTx = await Promise.race([pairTxPromise, timeoutPromise]);
                        
                        // 等待交易确认，设置超时：60秒
                        const waitTimeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error("等待交易确认超时（60秒）")), 60000);
                        });
                        
                        const waitPromise = pairTx.wait();
                        await Promise.race([waitPromise, waitTimeoutPromise]);
                        
                        // 查询 Pair 地址，设置超时：30秒
                        const pairQueryTimeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error("查询 Pair 地址超时（30秒）")), 30000);
                        });
                        
                        const pairQueryPromise = shib.uniswapV2Pair();
                        pairAddress = await Promise.race([pairQueryPromise, pairQueryTimeoutPromise]);
                        
                        console.log("交易对创建成功:", pairAddress);
                        
                        // 自动更新 .env 文件中的 UNISWAP_V2_PAIR
                        if (pairAddress && pairAddress !== ethers.ZeroAddress) {
                            updateEnvFile("UNISWAP_V2_PAIR", pairAddress);
                        }
                        
                        // 输出交易对的 Etherscan 链接
                        const pairEtherscanUrl = getEtherscanUrl(pairAddress, chainId, networkName);
                        if (pairEtherscanUrl) {
                            console.log("  交易对 Etherscan:", pairEtherscanUrl);
                        }
                        console.log("");
                        pairCreated = true;
                    } catch (error) {
                        retryCount++;
                        const isTimeout = error.message && (
                            error.message.includes("超时") || 
                            error.message.includes("Timeout") ||
                            error.message.includes("Connect Timeout")
                        );
                        
                        if (retryCount >= maxRetries) {
                            console.log("交易对创建失败（已重试 " + (maxRetries - 1) + " 次）:", error.message);
                            if (isTimeout) {
                                console.log("  原因: 网络连接超时");
                                console.log("  建议:");
                                console.log("    1. 检查网络连接");
                                console.log("    2. 检查 RPC 节点是否正常");
                                console.log("    3. 稍后手动调用 createOrGetPair() 函数");
                            } else {
                                console.log("  请稍后手动调用 createOrGetPair() 函数");
                            }
                            console.log("");
                        } else if (isTimeout) {
                            console.log(`  网络超时，将在 5 秒后重试（${retryCount}/${maxRetries}）...`);
                        } else {
                            // 非超时错误，直接退出重试循环
                            console.log("交易对创建失败:", error.message);
                            console.log("  请稍后手动调用 createOrGetPair() 函数");
                            console.log("");
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            console.log("Router设置失败:", error.message);
            console.log("  请稍后手动调用 setUniswapV2Router() 函数");
            console.log("");
        }
    }

    console.log("\n" + "=".repeat(80));
    console.log("部署完成!");
    console.log("=".repeat(80));
    console.log("\n部署摘要");
    console.log("─".repeat(80));
    console.log("网络名称:", networkName || `Chain ID: ${chainId}`);
    console.log("Chain ID:", chainId);
    console.log("合约地址:", shibAddress);
    if (etherscanUrl) {
        console.log("Etherscan:", etherscanUrl);
    }
    console.log("\n代币信息:");
    console.log("  名称:", deployedName);
    console.log("  符号:", deployedSymbol);
    console.log("  总供应量:", ethers.formatEther(deployedTotalSupply));
    console.log("  税率:", Number(deployedTaxRate), "基点 (", (Number(deployedTaxRate) / 100).toFixed(2), "%)");
    console.log("  税收接收地址:", deployedTaxReceiver);
    
    // 如果设置了 Router，输出 Uniswap 相关信息
    if (uniswapV2Router) {
        console.log("\nUniswap 信息:");
        console.log("  Router地址:", uniswapV2Router);
        
        // Factory 地址
        let factoryAddress = null;
        try {
            factoryAddress = await shib.uniswapV2Factory();
            console.log("  Factory地址:", factoryAddress);
            if (uniswapV2Factory && uniswapV2Factory.trim() !== "") {
                console.log("    (已手动设置，来自 .env 文件)");
            } else {
                console.log("    (已通过 Router 自动获取)");
            }
        } catch (error) {
            // 忽略错误
        }
        
        // WETH 地址
        if (wethAddress) {
            console.log("  WETH地址:", wethAddress);
            const wethFromEnv = process.env.UNISWAP_V2_WETH;
            if (wethFromEnv && wethFromEnv.trim() !== "" && wethFromEnv.toLowerCase() === wethAddress.toLowerCase()) {
                console.log("    (已从 .env 文件读取)");
            } else {
                console.log("    (已通过 Router 自动获取，已更新到 .env 文件)");
            }
        }
        
        // Pair 地址
        if (pairAddress && pairAddress !== ethers.ZeroAddress) {
            console.log("  Pair地址:", pairAddress);
            const pairFromEnv = process.env.UNISWAP_V2_PAIR;
            if (pairFromEnv && pairFromEnv.trim() !== "" && pairFromEnv.toLowerCase() === pairAddress.toLowerCase()) {
                console.log("    (已从 .env 文件读取)");
            } else {
                console.log("    (已自动创建，已更新到 .env 文件)");
            }
        }
        
        console.log("\n  说明:");
        console.log("        - WETH 地址通过 Router 合约自动获取，已自动更新到 .env 文件");
        console.log("        - WETH 是 Wrapped ETH（包装的以太币），不同网络有不同的 WETH 地址");
        if (uniswapV2Factory && uniswapV2Factory.trim() !== "") {
            console.log("        - Factory 地址已手动设置（来自 .env 文件）");
        } else {
            console.log("        - Factory 地址已通过 Router 自动获取");
        }
    }
    console.log("─".repeat(80));
    
    // 自动验证合约（如果启用）
    const autoVerify = process.env.AUTO_VERIFY === "true";
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    let verificationSuccess = false;
    
    if (autoVerify && etherscanUrl) {
        if (!etherscanApiKey || etherscanApiKey === "your_etherscan_api_key") {
            console.log("\n警告: AUTO_VERIFY=true 但未配置 ETHERSCAN_API_KEY");
            console.log("   请在 .env 文件中设置 ETHERSCAN_API_KEY");
            console.log("   可以稍后手动验证合约:");
            console.log("   npx hardhat verify --network", networkName, shibAddress, 
                        `"${name}"`, `"${symbol}"`, totalSupplyStr, taxRate, taxReceiver);
        } else {
            console.log("\n" + "=".repeat(80));
            console.log("开始验证合约...");
            console.log("=".repeat(80));
            
            try {
                // 等待几个区块确认，确保合约在链上可查询
                console.log("等待区块确认（约15秒）...");
                await new Promise(resolve => setTimeout(resolve, 15000));
                
                // 验证合约
                console.log("正在验证合约源代码...");
                await hre.run("verify:verify", {
                    address: shibAddress,
                    constructorArguments: [
                        name,
                        symbol,
                        totalSupply,
                        taxRate,
                        taxReceiver
                    ],
                });
                
                console.log("合约验证成功!");
                console.log("可以在 Etherscan 上查看已验证的合约:", etherscanUrl);
                
                // 标记验证成功（将在保存信息时使用）
                verificationSuccess = true;
            } catch (error) {
                console.log("合约验证失败:", error.message);
                console.log("\n可以稍后手动验证合约:");
                console.log("   使用命令: npx hardhat verify --network", networkName, shibAddress, 
                            `"${name}"`, `"${symbol}"`, totalSupplyStr, taxRate, taxReceiver);
                
                // 如果是已知的错误（如合约已验证），给出提示
                if (error.message && (
                    error.message.includes("Already Verified") || 
                    error.message.includes("already verified") ||
                    error.message.includes("Contract source code already verified")
                )) {
                    console.log("   注意: 合约可能已经验证过了");
                } else if (error.message && error.message.includes("API key")) {
                    console.log("   注意: 请检查 ETHERSCAN_API_KEY 是否正确配置");
                }
            }
            console.log("=".repeat(80));
        }
    } else if (etherscanUrl && !autoVerify) {
        console.log("\n提示: 可以在 Etherscan 上验证合约源代码");
        console.log("   设置 AUTO_VERIFY=true 可自动验证，或使用命令:");
        console.log("   npx hardhat verify --network", networkName, shibAddress, 
                    `"${name}"`, `"${symbol}"`, totalSupplyStr, taxRate, taxReceiver);
    }
    
    console.log("\n后续操作:");
    console.log("1.如果未设置Router，请调用: shib.setUniswapV2Router(routerAddress)");
    console.log("2.如果未创建交易对，请调用: shib.createOrGetPair()");
    console.log("3.配置交易限制: shib.setTransactionLimits(maxAmount, maxDaily)");
    console.log("4.管理黑名单/白名单: shib.updateBlacklist() / shib.updateWhitelist()");
    
    // 收集部署信息
    const deploymentInfo = {
        deployment: {
            startTime: deploymentStartTime,
            endTime: new Date().toISOString(),
            network: networkName || `Chain ID: ${chainId}`,
            chainId: chainId,
            deployer: deployer.address,
            deployerBalance: ethers.formatEther(balance) + " ETH"
        },
        contract: {
            address: shibAddress,
            name: deployedName,
            symbol: deployedSymbol,
            totalSupply: ethers.formatEther(deployedTotalSupply),
            taxRate: Number(deployedTaxRate),
            taxRatePercent: (Number(deployedTaxRate) / 100).toFixed(2) + "%",
            taxReceiver: deployedTaxReceiver,
            taxEnabled: deployedTaxEnabled
        },
        deploymentParams: {
            name: name,
            symbol: symbol,
            totalSupply: totalSupplyStr,
            taxRate: taxRate,
            taxReceiver: taxReceiver
        },
        links: {
            etherscan: etherscanUrl || null
        },
        verification: {
            autoVerify: autoVerify,
            verified: verificationSuccess,
            verifyCommand: etherscanUrl ? 
                `npx hardhat verify --network ${networkName} ${shibAddress} "${name}" "${symbol}" ${totalSupplyStr} ${taxRate} ${taxReceiver}` : 
                null
        },
        uniswap: {
            router: process.env.UNISWAP_V2_ROUTER || null,
            factory: process.env.UNISWAP_V2_FACTORY || null,
            factorySource: null, // "manual" 或 "auto"
            weth: null,
            wethSource: null, // "env" 或 "auto"
            pair: null,
            pairSource: null // "env" 或 "auto"
        },
        nextSteps: [
            "如果未设置Router，请调用: shib.setUniswapV2Router(routerAddress)",
            "如果未创建交易对，请调用: shib.createOrGetPair()",
            "配置交易限制: shib.setTransactionLimits(maxAmount, maxDaily)",
            "管理黑名单/白名单: shib.updateBlacklist() / shib.updateWhitelist()"
        ]
    };
    
    // 如果设置了 Router，添加 Factory、WETH 和 Pair 信息
    if (uniswapV2Router) {
        // Factory 地址
        try {
            const factory = await shib.uniswapV2Factory();
            deploymentInfo.uniswap.factory = factory;
            // 判断 Factory 地址来源
            if (uniswapV2Factory && uniswapV2Factory.trim() !== "" && 
                uniswapV2Factory.toLowerCase() === factory.toLowerCase()) {
                deploymentInfo.uniswap.factorySource = "manual";
            } else {
                deploymentInfo.uniswap.factorySource = "auto";
            }
        } catch (error) {
            // 忽略错误
        }
        
        // WETH 地址
        if (wethAddress) {
            deploymentInfo.uniswap.weth = wethAddress;
            // 判断 WETH 地址来源
            const wethFromEnv = process.env.UNISWAP_V2_WETH;
            if (wethFromEnv && wethFromEnv.trim() !== "" && 
                wethFromEnv.toLowerCase() === wethAddress.toLowerCase()) {
                deploymentInfo.uniswap.wethSource = "env";
            } else {
                deploymentInfo.uniswap.wethSource = "auto";
            }
        } else {
            // 如果之前没有获取到，尝试再次获取
            try {
                const router = await ethers.getContractAt("IUniswapV2Router02", uniswapV2Router);
                wethAddress = await router.WETH();
                deploymentInfo.uniswap.weth = wethAddress;
                deploymentInfo.uniswap.wethSource = "auto";
                
                // 自动更新 .env 文件中的 UNISWAP_V2_WETH
                if (wethAddress && wethAddress !== ethers.ZeroAddress) {
                    updateEnvFile("UNISWAP_V2_WETH", wethAddress);
                }
            } catch (error) {
                // 忽略错误
            }
        }
        
        // Pair 地址
        try {
            const pair = await shib.uniswapV2Pair();
            if (pair && pair !== ethers.ZeroAddress) {
                deploymentInfo.uniswap.pair = pair;
                pairAddress = pair; // 更新 pairAddress 变量
                // 判断 Pair 地址来源
                const pairFromEnv = process.env.UNISWAP_V2_PAIR;
                if (pairFromEnv && pairFromEnv.trim() !== "" && 
                    pairFromEnv.toLowerCase() === pair.toLowerCase()) {
                    deploymentInfo.uniswap.pairSource = "env";
                } else {
                    deploymentInfo.uniswap.pairSource = "auto";
                }
            }
        } catch (error) {
            // 忽略错误
        }
    }
    
    // 保存部署信息到文件
    saveDeploymentInfo(deploymentInfo);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
