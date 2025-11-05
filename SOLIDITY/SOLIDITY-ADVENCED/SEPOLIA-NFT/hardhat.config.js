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
