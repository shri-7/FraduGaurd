require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const GANACHE_RPC_URL = process.env.GANACHE_RPC_URL || "http://127.0.0.1:8545";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "1337");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ganache: {
      url: GANACHE_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: CHAIN_ID,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  defaultNetwork: "hardhat",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
