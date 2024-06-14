import Web3 from 'web3'

const MAINNET_URL = process.env.REACT_APP_MAINNET_URL
const ARBITRUM_URL = process.env.REACT_APP_ARBITRUM_URL
const TENDERLY_FORK_ID_MAINNET = process.env.REACT_APP_TENDERLY_FORK_ID_MAINNET
const TENDERLY_FORK_ID_ARBITRUM = process.env.REACT_APP_TENDERLY_FORK_ID_ARBITRUM

// Mainnet Endpoints
const userProvidedMainnetEndpoint = `${MAINNET_URL}`

// Arbitrum Endpoints
const abritrumOneEndpoint = 'https://arb1.arbitrum.io/rpc'
const userProvidedArbitrumEndpoint = `${ARBITRUM_URL}`

// Optimism Endpoints
const optimismEndpoint = 'https://mainnet.optimism.io'

// Tenderly Endpoints
const tenderlyForkEndpointMainnet: string = `https://rpc.tenderly.co/fork/${TENDERLY_FORK_ID_MAINNET}`
const tenderlyForkEndpointArbitrum: string = `https://rpc.tenderly.co/fork/${TENDERLY_FORK_ID_ARBITRUM}`

function initMainnetProvider(): Web3 {
  if (TENDERLY_FORK_ID_MAINNET !== undefined) {
    console.log('Mainnet correct')
    return new Web3(new Web3.providers.HttpProvider(tenderlyForkEndpointMainnet))
  } else {
    return new Web3(new Web3.providers.HttpProvider(userProvidedMainnetEndpoint))
  }
}

function initArbitrumProvider(): Web3 {
  if (TENDERLY_FORK_ID_ARBITRUM !== undefined) {
    console.log('Arbitrum correct')
    return new Web3(new Web3.providers.HttpProvider(tenderlyForkEndpointArbitrum))
  } else {
    try {
      return new Web3(new Web3.providers.HttpProvider(abritrumOneEndpoint))
    } catch (error) {
      return new Web3(new Web3.providers.HttpProvider(userProvidedArbitrumEndpoint))
    }
  }
}

function initOptimismProvider(): Web3 {
  return new Web3(new Web3.providers.HttpProvider(optimismEndpoint))
}

// when testing locally and only running sdk (without running frontend) we should comment out this function because
// window object won't be available
function initRPCProvider(chainId: number): Web3 {
  // check if metamask is connected
  if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
    return new Web3(window.ethereum)
  }
  if (chainId === 42161) {
    console.log('Arbitrum')
    return initArbitrumProvider()
  } else if (chainId === 1) {
    console.log('Mainnet')
    return initMainnetProvider()
  }
  console.log('Optimism')
  return initOptimismProvider()
}

// test method for running sdk locally
// function initRPCProvider(chainId: number): Web3 {
//   return initArbitrumProvider();
// }

export function initLocalHardhatProvider(): Web3 {
  return new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'))
}

export default initRPCProvider
