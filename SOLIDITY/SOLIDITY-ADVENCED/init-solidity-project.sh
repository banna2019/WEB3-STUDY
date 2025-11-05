#!/bin/bash

# ============================================
# Solidity 项目初始化脚手架脚本
# 基于 Hardhat 框架
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 获取项目名称
get_project_name() {
    if [ -z "$1" ]; then
        read -p "请输入项目名称 (默认: solidity-project): " project_name
        project_name=${project_name:-solidity-project}
    else
        project_name=$1
    fi
    echo "$project_name"
}

# 检查 Node.js 和 npm
print_info "检查环境依赖..."
check_command node
check_command npm
print_success "环境检查通过"

# 获取项目名称
PROJECT_NAME=$(get_project_name "$1")
PROJECT_DIR="./${PROJECT_NAME}"

# 检查项目目录是否已存在
if [ -d "$PROJECT_DIR" ]; then
    print_error "目录 $PROJECT_DIR 已存在"
    read -p "是否删除并重新创建? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        rm -rf "$PROJECT_DIR"
        print_success "已删除旧目录"
    else
        print_error "操作已取消"
        exit 1
    fi
fi

# 创建项目目录
print_info "创建项目目录: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
print_success "项目目录创建成功"

# 初始化 npm 项目
print_info "初始化 npm 项目..."
npm init -y > /dev/null 2>&1
print_success "npm 项目初始化完成"

# 更新 package.json
print_info "配置 package.json..."
cat > package.json << 'EOF'
{
  "name": "solidity-project",
  "version": "1.0.0",
  "description": "Hardhat-based Solidity smart contract project",
  "main": "index.js",
  "scripts": {
    "test": "hardhat test",
    "compile": "hardhat compile",
    "node": "hardhat node",
    "check-config": "node scripts/check-config.js",
    "deploy:sepolia": "hardhat run scripts/deploy.js --network sepolia",
    "deploy:all": "hardhat run scripts/deploy-all.js --network sepolia",
    "verify": "echo '❌ 请使用以下方式验证合约:' && echo '1. npm run verify:contract -- --address <合约地址>' && echo '2. npx hardhat verify --network sepolia <合约地址>'",
    "verify:contract": "hardhat run scripts/verify-contract.js --network sepolia"
  },
  "keywords": ["solidity", "hardhat", "ethereum", "smart-contracts"],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^6.1.0",
    "@nomicfoundation/hardhat-verify": "^2.1.3",
    "dotenv": "^17.2.3",
    "hardhat": "^2.26.5",
    "hardhat-deploy": "^1.0.4",
    "hardhat-gas-reporter": "^2.3.0",
    "solidity-coverage": "^0.8.16"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^5.4.0"
  }
}
EOF

# 更新项目名称
if [ "$PROJECT_NAME" != "solidity-project" ]; then
    sed -i.bak "s/\"name\": \"solidity-project\"/\"name\": \"$PROJECT_NAME\"/" package.json
    rm -f package.json.bak
fi

print_success "package.json 配置完成"

# 安装依赖
print_info "安装依赖包 (这可能需要几分钟)..."
npm install
print_success "依赖包安装完成"

# 创建目录结构
print_info "创建项目目录结构..."
mkdir -p contracts
mkdir -p test
mkdir -p scripts
mkdir -p ignition/modules
print_success "目录结构创建完成"

# 创建 hardhat.config.js
print_info "创建 Hardhat 配置文件..."
cat > hardhat.config.js << 'EOF'
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// 配置验证和 RPC URL 构建
function getSepoliaRpcUrl() {
  // 优先使用自定义 RPC URL
  if (process.env.SEPOLIA_RPC_URL) {
    return process.env.SEPOLIA_RPC_URL;
  }
  
  // 处理 Infura Project ID
  const infuraProjectId = process.env.INFURA_PROJECT_ID?.trim();
  if (infuraProjectId && infuraProjectId !== "" && infuraProjectId !== "your_infura_project_id_here") {
    // 如果已经是完整 URL，直接使用（但需要是 sepolia 网络）
    if (infuraProjectId.startsWith("http://") || infuraProjectId.startsWith("https://")) {
      // 如果是 sepolia 网络的 URL，直接使用
      if (infuraProjectId.includes("sepolia")) {
        return infuraProjectId;
      }
      // 如果是其他网络的 URL，替换为 sepolia
      return infuraProjectId.replace(/infura\.io\/v3\/[^\/]+/, "sepolia.infura.io/v3/" + infuraProjectId.match(/infura\.io\/v3\/([^\/\s]+)/)?.[1]?.replace(/[^a-zA-Z0-9]/g, "") || "");
    }
    
    // 如果是 Infura URL 格式，尝试从 URL 中提取 Project ID
    const urlMatch = infuraProjectId.match(/infura\.io\/v3\/([^\/\s\@\&]+)/);
    if (urlMatch) {
      // 清理 Project ID：移除无效字符（只保留字母和数字）
      const cleanProjectId = urlMatch[1].replace(/[^a-zA-Z0-9]/g, "");
      if (cleanProjectId) {
        return `https://sepolia.infura.io/v3/${cleanProjectId}`;
      }
    }
    
    // 清理 Project ID：移除无效字符
    const cleanProjectId = infuraProjectId.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanProjectId && cleanProjectId.length > 10) {
      // 如果清理后还有有效内容，使用它
      return `https://sepolia.infura.io/v3/${cleanProjectId}`;
    } else if (cleanProjectId && cleanProjectId.length <= 10) {
      // Project ID 太短，可能无效，使用备用 RPC
      console.warn("⚠️  Infura Project ID 可能无效，使用公共 RPC");
      return "https://rpc.sepolia.org";
    }
    
    // 否则当作 Project ID 使用（先清理）
    return `https://sepolia.infura.io/v3/${infuraProjectId.replace(/[^a-zA-Z0-9]/g, "")}`;
  }
  
  // 使用备用公共 RPC
  return "https://rpc.sepolia.org";
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: getSepoliaRpcUrl(),
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    // 使用 Etherscan API V2（统一 API Key）
    // 迁移指南: https://docs.etherscan.io/v2-migration
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
EOF
print_success "Hardhat 配置文件创建完成"

# 创建 .gitignore
print_info "创建 .gitignore 文件..."
cat > .gitignore << 'EOF'
node_modules
.env

# Hardhat files
/cache
/artifacts

# TypeChain files
/typechain
/typechain-types

# solidity-coverage files
/coverage
/coverage.json

# Hardhat Ignition default folder for deployments against a local node
ignition/deployments/chain-31337
EOF
print_success ".gitignore 文件创建完成"

# 创建 .env.example
print_info "创建 .env.example 文件..."
cat > .env.example << 'EOF'
# 钱包私钥（用于部署合约，不要包含 0x 前缀）
PRIVATE_KEY=your_private_key_here

# Infura Project ID（用于连接 Sepolia 测试网络）
# 获取方式: https://app.infura.io/
INFURA_PROJECT_ID=your_infura_project_id_here

# 或者使用自定义 RPC URL（可选，如果设置了 INFURA_PROJECT_ID 则不需要）
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id

# Etherscan API Key（用于验证合约）
# 获取方式: https://etherscan.io/myapikey
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# 合约验证相关配置（可选）
# 用于 verify:contract 脚本
# 这里合约地址不需要手动填写;执行完成合约部署之后,合约部署脚本会自动进行替换写入合约地址(需要去掉"#",打开注释)
CONTRACT_ADDRESS=your_contract_address_here

# ERC20Token 合约构造函数参数（可选，如果与部署时不同需要设置）
TOKEN_NAME=My Token
TOKEN_SYMBOL=MTK
TOKEN_DECIMALS=18
TOKEN_INITIAL_SUPPLY=1000000
EOF
print_success ".env.example 文件创建完成"

# 创建示例合约
print_info "创建示例合约..."
cat > contracts/HelloWorld.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HelloWorld
 * @dev 一个简单的示例合约
 */
contract HelloWorld {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }

    function setMessage(string memory _message) public {
        message = _message;
    }

    function getMessage() public view returns (string memory) {
        return message;
    }
}
EOF
print_success "示例合约创建完成"

# 创建测试文件
print_info "创建测试文件..."
cat > test/HelloWorld.js << 'EOF'
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
EOF
print_success "测试文件创建完成"

# 创建部署脚本
print_info "创建部署脚本..."
cat > scripts/deploy.js << 'EOF'
const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署合约到 Sepolia 测试网络...\n");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 部署账户地址:", deployer.address);

  // 获取账户余额
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", hre.ethers.formatEther(balance), "ETH\n");

  // 检查余额是否足够支付 gas 费用
  if (balance === 0n) {
    throw new Error("❌ 账户余额不足，请先获取 Sepolia ETH");
  }

  // 部署 HelloWorld 合约
  console.log("📦 正在部署 HelloWorld 合约...");
  const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");
  const helloWorld = await HelloWorld.deploy("Hello, Sepolia!");
  await helloWorld.waitForDeployment();

  const address = await helloWorld.getAddress();
  console.log("✅ HelloWorld 部署成功!");
  console.log("📍 合约地址:", address);
  console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${address}`);

  // 等待交易确认
  console.log("\n⏳ 等待交易确认...");
  await helloWorld.deploymentTransaction()?.wait(5);
  console.log("✅ 交易已确认!\n");

  // 可选：验证合约
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("🔍 开始验证合约...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: ["Hello, Sepolia!"],
      });
      console.log("✅ 合约验证成功!");
    } catch (error) {
      console.log("⚠️  合约验证失败:", error.message);
    }
  } else {
    console.log("ℹ️  跳过合约验证 (未设置 ETHERSCAN_API_KEY)");
  }

  console.log("\n✨ 部署完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
EOF
print_success "部署脚本创建完成"

# 创建配置检查脚本
print_info "创建配置检查脚本..."
cat > scripts/check-config.js << 'EOF'
require("dotenv").config();

console.log("🔍 检查 Hardhat 配置...\n");

// 检查 .env 文件是否存在
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env");

if (!fs.existsSync(envPath)) {
  console.log("❌ .env 文件不存在");
  console.log("💡 请先复制 .env.example 为 .env:");
  console.log("   cp .env.example .env\n");
  process.exit(1);
}

console.log("✅ .env 文件存在\n");

// 检查关键配置
const checks = [
  {
    name: "PRIVATE_KEY",
    value: process.env.PRIVATE_KEY,
    required: true,
    mask: true,
  },
  {
    name: "INFURA_PROJECT_ID",
    value: process.env.INFURA_PROJECT_ID,
    required: false,
    mask: false,
  },
  {
    name: "SEPOLIA_RPC_URL",
    value: process.env.SEPOLIA_RPC_URL,
    required: false,
    mask: true,
  },
  {
    name: "ETHERSCAN_API_KEY",
    value: process.env.ETHERSCAN_API_KEY,
    required: false,
    mask: true,
  },
];

console.log("📋 配置检查结果:\n");
let hasErrors = false;

checks.forEach((check) => {
  const isSet = check.value && check.value.trim() !== "" && check.value !== `your_${check.name.toLowerCase()}_here`;
  const status = isSet ? "✅" : check.required ? "❌" : "⚠️ ";
  
  let displayValue = check.value || "(未设置)";
  if (check.mask && displayValue !== "(未设置)") {
    displayValue = displayValue.substring(0, 10) + "***";
  }
  
  console.log(`${status} ${check.name}: ${displayValue}`);
  
  if (!isSet && check.required) {
    hasErrors = true;
  }
  
  // 特殊检查
  if (check.name === "INFURA_PROJECT_ID") {
    if (check.value === "your_infura_project_id_here") {
      console.log("   ⚠️  检测到占位符值，请替换为实际的 Project ID");
      hasErrors = true;
    } else if (check.value && (check.value.startsWith("http://") || check.value.startsWith("https://"))) {
      // 检测到完整 URL，尝试提取 Project ID
      const urlMatch = check.value.match(/infura\.io\/v3\/([^\/\s]+)/);
      if (urlMatch) {
        console.log(`   ℹ️  检测到完整 URL，已提取 Project ID: ${urlMatch[1].substring(0, 20)}...`);
      } else {
        console.log("   ⚠️  检测到 URL 格式但无法提取 Project ID");
      }
    } else if (check.value && check.value.includes("@") || check.value.includes("&")) {
      console.log("   ⚠️  Project ID 包含特殊字符，可能无效");
      console.log("   💡 建议: Project ID 应该只包含字母和数字");
    }
  }
});

console.log("\n");

// RPC URL 构建
let rpcUrl = "";
if (process.env.SEPOLIA_RPC_URL) {
  rpcUrl = process.env.SEPOLIA_RPC_URL;
  console.log("📡 将使用自定义 RPC URL");
} else if (process.env.INFURA_PROJECT_ID && 
           process.env.INFURA_PROJECT_ID.trim() !== "" && 
           process.env.INFURA_PROJECT_ID !== "your_infura_project_id_here") {
  rpcUrl = `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
  console.log("📡 将使用 Infura RPC");
} else {
  rpcUrl = "https://rpc.sepolia.org";
  console.log("📡 将使用公共 RPC (备用)");
}

console.log("🔗 RPC URL:", rpcUrl.replace(/(infura\.io\/v3\/)[a-zA-Z0-9]+/, "$1***"));

if (hasErrors) {
  console.log("\n❌ 配置检查失败，请修复上述问题后重试");
  console.log("\n💡 快速解决方案:");
  console.log("1. 确保 .env 文件存在: cp .env.example .env");
  console.log("2. 设置 PRIVATE_KEY: 你的钱包私钥（不含 0x 前缀）");
  console.log("3. 设置 INFURA_PROJECT_ID: 访问 https://app.infura.io/ 获取");
  console.log("   或设置 SEPOLIA_RPC_URL: 使用其他 RPC 端点");
  process.exit(1);
} else {
  console.log("\n✅ 配置检查通过，可以开始部署！");
  console.log("\n🚀 运行部署命令:");
  console.log("   npm run deploy:sepolia");
}
EOF
print_success "配置检查脚本创建完成"

# 创建验证脚本
print_info "创建验证脚本..."
cat > scripts/verify-contract.js << 'EOF'
const hre = require("hardhat");

/**
 * 验证单个合约的脚本
 */
async function main() {
  // 从命令行参数获取合约地址
  let address = null;
  
  // 方法1: 通过 --address 参数
  const addressIndex = process.argv.findIndex(arg => arg === "--address");
  if (addressIndex !== -1 && process.argv[addressIndex + 1]) {
    address = process.argv[addressIndex + 1];
  }
  
  // 方法2: 直接查找以 0x 开头的参数（排除 hardhat 相关参数）
  if (!address) {
    const hardhatArgs = ["hardhat", "run", "scripts/verify-contract.js", "--network"];
    address = process.argv.find(arg => 
      arg.startsWith("0x") && 
      arg.length === 42 && 
      !hardhatArgs.includes(arg)
    );
  }

  if (!address || !address.startsWith("0x")) {
    console.error("❌ 错误: 请提供有效的合约地址");
    console.log("\n📖 使用方法:");
    console.log("  方法1: npm run verify:contract -- --address <合约地址>");
    console.log("  方法2: npx hardhat run scripts/verify-contract.js --network sepolia --address <合约地址>");
    console.log("\n💡 示例:");
    console.log('  npm run verify:contract -- --address "0x1234567890123456789012345678901234567890"');
    console.log('  npx hardhat verify --network sepolia 0x1234567890123456789012345678901234567890');
    process.exit(1);
  }

  // 检查 API Key
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ 错误: 未设置 ETHERSCAN_API_KEY");
    console.log("💡 请在 .env 文件中设置 ETHERSCAN_API_KEY");
    process.exit(1);
  }

  console.log(`🔍 开始验证合约...`);
  console.log(`📍 合约地址: ${address}`);
  console.log(`🌐 网络: Sepolia\n`);

  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log(`\n✅ 合约验证成功!`);
    console.log(`🔗 查看合约: https://sepolia.etherscan.io/address/${address}`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log(`\n✅ 合约已验证过，无需重复验证`);
      console.log(`🔗 查看合约: https://sepolia.etherscan.io/address/${address}`);
    } else {
      console.error(`\n❌ 验证失败:`, error.message);
      console.log("\n💡 常见问题:");
      console.log("  1. 确保合约地址正确");
      console.log("  2. 确保合约已在 Sepolia 网络上部署");
      console.log("  3. 确保编译器版本和优化器设置与部署时一致");
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 验证过程出错:", error);
    process.exit(1);
  });
EOF
print_success "验证脚本创建完成"

# 创建 README.md
print_info "创建 README.md..."
cat > README.md << 'EOF'
# Solidity Project

这是一个基于 Hardhat 的 Solidity 智能合约项目。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置以下变量：
- `PRIVATE_KEY`: 你的钱包私钥（用于部署合约）
- `INFURA_PROJECT_ID`: Infura Project ID（用于连接 Sepolia 测试网络）
- `ETHERSCAN_API_KEY`: Etherscan API Key（用于验证合约）

### 3. 检查配置

```bash
npm run check-config
```

### 4. 编译合约

```bash
npm run compile
```

### 5. 运行测试

```bash
npm test
```

### 6. 部署合约

```bash
npm run deploy:sepolia
```

### 7. 验证合约

```bash
npm run verify:contract -- --address <合约地址>
```

## 📁 项目结构

```
.
├── contracts/          # Solidity 合约文件
├── test/              # 测试文件
├── scripts/           # 部署和工具脚本
├── hardhat.config.js  # Hardhat 配置文件
└── package.json       # 项目依赖配置
```

## 📚 相关文档

- [Hardhat 文档](https://hardhat.org/docs)
- [Solidity 文档](https://docs.soliditylang.org/)
- [Etherscan API 文档](https://docs.etherscan.io/)

## 📝 许可证

ISC
EOF
print_success "README.md 创建完成"

# 返回项目根目录
cd ..

# 完成
echo ""
print_success "项目初始化完成！"
echo ""
print_info "项目位置: $PROJECT_DIR"
echo ""
print_info "下一步操作:"
echo "  1. cd $PROJECT_DIR"
echo "  2. cp .env.example .env"
echo "  3. 编辑 .env 文件，填写配置信息"
echo "  4. npm run check-config  # 检查配置"
echo "  5. npm run compile      # 编译合约"
echo "  6. npm test             # 运行测试"
echo ""
print_success "Happy coding! 🎉"

