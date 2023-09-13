require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config({path:__dirname+'/.env'})

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
      url: process.env.ARBITRUM_URL,
      accounts: [
        process.env.SECRET_KEY || "",
      ]
    },
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.ARBITRUM_URL,
      }
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545/"
    },
    tenderly: {
        chainId: 42161,
        url: `https://rpc.tenderly.co/fork/${process.env.TENDERLY_FORK_ID}`,
        accounts: [
            process.env.SECRET_KEY || "",
        ]
    }
  }
};
