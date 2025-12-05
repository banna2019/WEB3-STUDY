require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: (() => {
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) return [];
        // 移除0x前缀（如果有）并检查长度
        const keyWithoutPrefix = privateKey.startsWith("0x") 
          ? privateKey.slice(2) 
          : privateKey;
        // 私钥应该是64个十六进制字符（32字节）
        if (keyWithoutPrefix.length === 64) {
          return [privateKey.startsWith("0x") ? privateKey : "0x" + privateKey];
        }
        // 如果私钥格式不正确，返回空数组（编译时不会报错，但部署时会失败）
        return [];
      })(),
      gasPrice: 30000000000, // 30 Gwei
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

