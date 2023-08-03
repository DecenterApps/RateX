require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({path:__dirname+'/.env'})
require('@openzeppelin/hardhat-upgrades');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19"
      },
      {
        version: "0.8.0"
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.4.19",
      },
    ]
  },
  defaultNetwork: "hardhat",
  networks: {
    arbitrum: {
      chainId: 42161,
      url: process.env.ARBITRUM_URL_ALCHEMY,
      accounts: [
        process.env.ACC1_SK || "",
      ]
    },
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.ARBITRUM_URL_ALCHEMY,
      }
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545/"
    }
  }
};
