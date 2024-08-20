require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config({ path: __dirname + '/.env' })

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  mocha: {
    timeout: 100000000,
  },
  solidity: {
    compilers: [
      {
        version: '0.8.24',
        settings: {
          evmVersion: 'cancun',
        }
      },
      {
        version: '0.8.0',
      },
      {
        version: '0.6.6',
      },
      {
        version: '0.4.19',
      },
    ],
  },
  defaultNetwork: 'hardhat',
  networks: {
    mainnet: {
      chainId: 1,
      url: process.env.MAINNET_URL,
      accounts: [process.env.SECRET_KEY || ''],
    },
    arbitrum: {
      chainId: 42161,
      url: process.env.ARBITRUM_URL,
      accounts: [process.env.SECRET_KEY || ''],
    },
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.ARBITRUM_URL,
      },
    },
    localhost: {
      chainId: 31337,
      url: 'http://127.0.0.1:8545/',
    },
    tenderlyMainnet: {
      chainId: 1,
      url: `https://rpc.tenderly.co/fork/${process.env.TENDERLY_FORK_ID_MAINNET}`,
      accounts: [process.env.SECRET_KEY || ''],
    },
    tenderlyArbitrum: {
      chainId: 42161,
      url: `https://rpc.tenderly.co/fork/${process.env.TENDERLY_FORK_ID_ARBITRUM}`,
      accounts: [process.env.SECRET_KEY || ''],
    },
  },
}
