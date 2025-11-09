require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { collectGasData } = require("./collect-gas-data");

/**
 * Gas 分析和报告生成脚本
 * 1. 运行所有测试并收集 Gas 数据
 * 2. 分析 Gas 使用情况
 * 3. 生成优化建议
 * 4. 导出 markdown 报告
 */

// Gas 优化建议数据库
const optimizationSuggestions = {
  storage: [
    {
      pattern: "mapping",
      suggestion: "考虑使用 packed storage 来减少 storage slot 使用",
      impact: "high"
    },
    {
      pattern: "uint256",
      suggestion: "如果值不会超过 uint128，考虑使用更小的类型来节省 storage",
      impact: "medium"
    },
    {
      pattern: "string memory",
      suggestion: "考虑使用 bytes32 代替短字符串，或使用 events 存储数据",
      impact: "high"
    }
  ],
  loops: [
    {
      pattern: "for loop",
      suggestion: "避免在循环中进行 storage 读写，考虑批量操作",
      impact: "high"
    },
    {
      pattern: "array.push",
      suggestion: "如果数组大小已知，使用固定大小数组",
      impact: "medium"
    }
  ],
  external: [
    {
      pattern: "external call",
      suggestion: "批量外部调用，减少调用次数",
      impact: "medium"
    },
    {
      pattern: "transfer",
      suggestion: "考虑使用 sendValue 或低级别 call 来节省 Gas",
      impact: "low"
    }
  ],
  events: [
    {
      pattern: "event",
      suggestion: "事件参数使用 indexed 可以节省 Gas（但会增加查询成本）",
      impact: "low"
    }
  ]
};

// Gas 阈值定义
const gasThresholds = {
  deployment: {
    low: 1000000,
    medium: 3000000,
    high: 5000000
  },
  function: {
    low: 50000,
    medium: 100000,
    high: 200000
  }
};

async function runTestsAndCollectGas() {
  console.log("🧪 开始运行测试并收集 Gas 数据...\n");

  try {
    // 运行测试（不捕获输出，让用户看到测试进度）
    console.log("正在运行测试套件...\n");
    execSync("npm test", {
      encoding: "utf-8",
      cwd: process.cwd(),
      stdio: "inherit"
    });

    console.log("\n✅ 测试完成\n");
    return true;
  } catch (error) {
    console.error("\n⚠️  测试运行有错误，但将继续生成报告\n");
    // 即使测试失败，也继续生成报告
    return false;
  }
}

async function analyzeContractGas(contractName, gasData) {
  const analysis = {
    contract: contractName,
    deployment: null,
    functions: [],
    optimizations: []
  };

  // 分析部署 Gas
  if (gasData.deployment && typeof gasData.deployment === 'number') {
    analysis.deployment = {
      gas: gasData.deployment,
      level: getGasLevel(gasData.deployment, "deployment"),
      suggestion: gasData.deployment > gasThresholds.deployment.high 
        ? "部署 Gas 较高，考虑优化构造函数和初始化逻辑"
        : null
    };
  }

  // 分析函数 Gas
  if (gasData.functions) {
    for (const func of gasData.functions) {
      const funcAnalysis = {
        name: func.name,
        gas: func.gas,
        level: getGasLevel(func.gas, "function"),
        suggestions: []
      };

      // 根据 Gas 使用量提供建议
      if (func.gas > gasThresholds.function.high) {
        funcAnalysis.suggestions.push({
          type: "high_gas",
          message: "函数 Gas 消耗较高，建议优化逻辑",
          impact: "high"
        });
      }

      analysis.functions.push(funcAnalysis);
    }
  }

  return analysis;
}

function getGasLevel(gas, type) {
  const thresholds = gasThresholds[type];
  if (gas < thresholds.low) return "low";
  if (gas < thresholds.medium) return "medium";
  if (gas < thresholds.high) return "high";
  return "very_high";
}

function analyzeOptimizations(contractCode) {
  const optimizations = [];

  // 检查 storage 使用
  if (contractCode.includes("mapping") && contractCode.includes("uint256")) {
    optimizations.push({
      type: "storage",
      issue: "使用 mapping(uint256 => ...) 可能可以优化",
      suggestion: "考虑使用 packed storage 或更小的数据类型",
      impact: "medium"
    });
  }

  // 检查循环
  if (contractCode.includes("for (") && contractCode.includes("storage")) {
    optimizations.push({
      type: "loop",
      issue: "循环中可能包含 storage 操作",
      suggestion: "将 storage 操作移到循环外，或使用批量操作",
      impact: "high"
    });
  }

  // 检查字符串使用
  if (contractCode.match(/string\s+memory/g)?.length > 3) {
    optimizations.push({
      type: "string",
      issue: "大量使用 string memory",
      suggestion: "考虑使用 bytes32 或 events 存储数据",
      impact: "high"
    });
  }

  return optimizations;
}

async function generateGasReport(actualGasData = null) {
  console.log("📊 生成 Gas 分析报告...\n");

  // 创建 GasExpenses 目录
  const reportDir = path.join(process.cwd(), "GasExpenses");
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
    console.log("📁 创建 GasExpenses 目录\n");
  }

  // 读取合约文件（排除 Mock 合约）
  const contractsDir = path.join(process.cwd(), "contracts");
  const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith(".sol") && !f.includes("Mock"));

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const reportFile = path.join(reportDir, `gas-report-${timestamp}.md`);
  const optimizationFile = path.join(reportDir, `gas-optimization-${timestamp}.md`);

  let reportContent = `# Gas 使用分析报告\n\n`;
  reportContent += `**生成时间**: ${new Date().toLocaleString("zh-CN")}\n\n`;
  reportContent += `**网络**: Hardhat Local Network\n\n`;
  reportContent += `---\n\n`;

  let optimizationContent = `# Gas 优化建议报告\n\n`;
  optimizationContent += `**生成时间**: ${new Date().toLocaleString("zh-CN")}\n\n`;
  optimizationContent += `---\n\n`;

  // 分析每个合约
  for (const contractFile of contractFiles) {
    const contractName = contractFile.replace(".sol", "");
    const contractPath = path.join(contractsDir, contractFile);
    const contractCode = fs.readFileSync(contractPath, "utf-8");

    console.log(`📝 分析合约: ${contractName}`);

    // 读取编译后的合约信息
    const artifactPath = path.join(
      process.cwd(),
      "artifacts",
      "contracts",
      contractFile,
      `${contractName}.json`
    );

    let gasData = {
      deployment: null,
      functions: []
    };

    // 优先使用实际收集的 Gas 数据
    if (actualGasData && actualGasData[contractName]) {
      const actual = actualGasData[contractName];
      gasData.deployment = parseInt(actual.deployment) || null;
      gasData.functions = Object.entries(actual.functions || {}).map(([name, gas]) => ({
        name,
        gas: parseInt(gas)
      }));
    } else if (fs.existsSync(artifactPath)) {
      // 如果没有实际数据，使用估算
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
      
      // 估算部署 Gas（基于字节码大小）
      if (artifact.bytecode) {
        const bytecodeSize = (artifact.bytecode.length - 2) / 2; // 减去 0x 前缀
        gasData.deployment = 21000 + bytecodeSize * 16; // 基础 Gas + 字节码 Gas
      }

      // 分析函数
      if (artifact.abi) {
        for (const item of artifact.abi) {
          if (item.type === "function" && item.stateMutability !== "view" && item.stateMutability !== "pure") {
            // 估算函数 Gas（基于函数复杂度）
            let estimatedGas = 21000; // 基础交易 Gas
            if (item.inputs) estimatedGas += item.inputs.length * 1000;
            if (item.outputs) estimatedGas += item.outputs.length * 500;
            
            // 根据函数名估算额外 Gas
            if (item.name.includes("transfer")) estimatedGas += 30000;
            if (item.name.includes("mint")) estimatedGas += 50000;
            if (item.name.includes("create")) estimatedGas += 40000;
            if (item.name.includes("batch")) estimatedGas += 20000;

            gasData.functions.push({
              name: item.name,
              gas: estimatedGas
            });
          }
        }
      }
    }

    // 分析合约
    const analysis = await analyzeContractGas(contractName, gasData);
    const optimizations = analyzeOptimizations(contractCode);

    // 生成报告内容
    reportContent += `## ${contractName}\n\n`;

    if (analysis.deployment && analysis.deployment.gas) {
      reportContent += `### 部署 Gas\n\n`;
      reportContent += `| 指标 | 值 | 等级 |\n`;
      reportContent += `|------|-----|------|\n`;
      reportContent += `| Gas 消耗 | ${analysis.deployment.gas.toLocaleString()} | ${analysis.deployment.level} |\n\n`;
      
      if (analysis.deployment.suggestion) {
        reportContent += `⚠️ **注意**: ${analysis.deployment.suggestion}\n\n`;
      }
    }

    if (analysis.functions.length > 0) {
      reportContent += `### 函数 Gas 消耗\n\n`;
      reportContent += `| 函数名 | Gas 消耗 | 等级 |\n`;
      reportContent += `|--------|----------|------|\n`;
      
      for (const func of analysis.functions) {
        reportContent += `| ${func.name} | ${func.gas.toLocaleString()} | ${func.level} |\n`;
      }
      reportContent += `\n`;
    }

    // 生成优化建议
    optimizationContent += `## ${contractName}\n\n`;

    if (optimizations.length > 0) {
      optimizationContent += `### 优化建议\n\n`;
      
      for (const opt of optimizations) {
        const impactEmoji = opt.impact === "high" ? "🔴" : opt.impact === "medium" ? "🟡" : "🟢";
        optimizationContent += `#### ${impactEmoji} ${opt.type.toUpperCase()} - ${opt.issue}\n\n`;
        optimizationContent += `**影响**: ${opt.impact}\n\n`;
        optimizationContent += `**建议**: ${opt.suggestion}\n\n`;
        optimizationContent += `---\n\n`;
      }
    } else {
      optimizationContent += `✅ 未发现明显的优化点\n\n`;
    }

    // 添加函数级别的优化建议
    if (analysis.functions.length > 0) {
      const highGasFunctions = analysis.functions.filter(f => f.level === "high" || f.level === "very_high");
      if (highGasFunctions.length > 0) {
        optimizationContent += `### 高 Gas 函数优化建议\n\n`;
        for (const func of highGasFunctions) {
          optimizationContent += `#### ${func.name}\n\n`;
          optimizationContent += `- **当前 Gas**: ${func.gas.toLocaleString()}\n`;
          optimizationContent += `- **建议**: 检查函数逻辑，考虑以下优化：\n`;
          optimizationContent += `  - 减少 storage 读写操作\n`;
          optimizationContent += `  - 使用 events 代替 storage 存储非关键数据\n`;
          optimizationContent += `  - 批量处理操作\n`;
          optimizationContent += `  - 使用更高效的数据结构\n\n`;
        }
      }
    }

    optimizationContent += `---\n\n`;
  }

  // 添加总结
  reportContent += `## 总结\n\n`;
  reportContent += `### Gas 使用统计\n\n`;
  
  let totalDeployment = 0;
  let totalFunctions = 0;
  let highGasFunctions = 0;

  for (const contractFile of contractFiles) {
    const contractName = contractFile.replace(".sol", "");
    const artifactPath = path.join(
      process.cwd(),
      "artifacts",
      "contracts",
      contractFile,
      `${contractName}.json`
    );
    
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
      if (artifact.bytecode) {
        const bytecodeSize = (artifact.bytecode.length - 2) / 2;
        totalDeployment += 21000 + bytecodeSize * 16;
      }
    }
  }

  reportContent += `- **总部署 Gas**: ${totalDeployment.toLocaleString()}\n`;
  reportContent += `- **合约数量**: ${contractFiles.length}\n`;
  reportContent += `- **平均部署 Gas**: ${Math.round(totalDeployment / contractFiles.length).toLocaleString()}\n\n`;

  optimizationContent += `## 总体优化建议\n\n`;
  optimizationContent += `### 通用优化策略\n\n`;
  optimizationContent += `1. **Storage 优化**\n`;
  optimizationContent += `   - 使用 packed storage 减少 storage slot 使用\n`;
  optimizationContent += `   - 使用更小的数据类型（uint128, uint64 等）\n`;
  optimizationContent += `   - 将相关数据打包到单个 storage slot\n\n`;
  optimizationContent += `2. **循环优化**\n`;
  optimizationContent += `   - 避免在循环中进行 storage 操作\n`;
  optimizationContent += `   - 使用批量操作代替多次单独操作\n`;
  optimizationContent += `   - 考虑使用映射代替数组遍历\n\n`;
  optimizationContent += `3. **外部调用优化**\n`;
  optimizationContent += `   - 批量外部调用\n`;
  optimizationContent += `   - 使用低级别 call 代替 transfer\n`;
  optimizationContent += `   - 缓存外部调用结果\n\n`;
  optimizationContent += `4. **事件优化**\n`;
  optimizationContent += `   - 使用 indexed 参数提高查询效率（但会增加 Gas）\n`;
  optimizationContent += `   - 将非关键数据存储在 events 而不是 storage\n\n`;

  // 保存报告
  fs.writeFileSync(reportFile, reportContent, "utf-8");
  fs.writeFileSync(optimizationFile, optimizationContent, "utf-8");

  console.log(`\n✅ Gas 分析报告已生成:`);
  console.log(`   📄 ${reportFile}`);
  console.log(`   📄 ${optimizationFile}\n`);

  return {
    reportFile,
    optimizationFile,
    totalDeployment,
    contractCount: contractFiles.length
  };
}

async function main() {
  console.log("🚀 开始 Gas 分析和报告生成...\n");

  try {
    // 1. 运行测试
    await runTestsAndCollectGas();

    // 2. 收集实际 Gas 数据
    console.log("📊 收集实际 Gas 数据...\n");
    let actualGasData = null;
    try {
      actualGasData = await collectGasData();
      console.log("✅ Gas 数据收集完成\n");
    } catch (error) {
      console.log("⚠️  无法收集实际 Gas 数据，将使用估算值\n");
    }

    // 3. 生成报告
    const result = await generateGasReport(actualGasData);

    console.log("=".repeat(50));
    console.log("📊 分析完成!");
    console.log("=".repeat(50));
    console.log(`总部署 Gas: ${result.totalDeployment.toLocaleString()}`);
    console.log(`合约数量: ${result.contractCount}`);
    console.log(`报告文件: GasExpenses/`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("❌ 分析失败:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 执行失败:", error);
    process.exit(1);
  });

