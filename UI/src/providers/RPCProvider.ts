import Web3 from 'web3'

const optimismEndpoint = 'https://mainnet.optimism.io'

function initMainnetProvider(): Web3 {
  const MAINNET_URL = process.env.REACT_APP_MAINNET_URL
  const TENDERLY_FORK_ID_MAINNET = process.env.REACT_APP_TENDERLY_FORK_ID_MAINNET
  const userProvidedMainnetEndpoint = `${MAINNET_URL}`
  if (TENDERLY_FORK_ID_MAINNET && TENDERLY_FORK_ID_MAINNET.length > 10) {
    const tenderlyForkEndpointMainnet: string = `https://rpc.tenderly.co/fork/${TENDERLY_FORK_ID_MAINNET}`
    return new Web3(new Web3.providers.HttpProvider(tenderlyForkEndpointMainnet))
  } else {
    return new Web3(new Web3.providers.HttpProvider(userProvidedMainnetEndpoint))
  }
}

function initArbitrumProvider(): Web3 {
  const ARBITRUM_URL = process.env.REACT_APP_ARBITRUM_URL
  const TENDERLY_FORK_ID_ARBITRUM = process.env.REACT_APP_TENDERLY_FORK_ID_ARBITRUM
  const userProvidedArbitrumEndpoint = `${ARBITRUM_URL}`
  if (TENDERLY_FORK_ID_ARBITRUM && TENDERLY_FORK_ID_ARBITRUM.length > 10) {
    const tenderlyForkEndpointArbitrum: string = `https://rpc.tenderly.co/fork/${TENDERLY_FORK_ID_ARBITRUM}`
    return new Web3(new Web3.providers.HttpProvider(tenderlyForkEndpointArbitrum))
  } else {
      return new Web3(new Web3.providers.HttpProvider(userProvidedArbitrumEndpoint))
  }
}

function initOptimismProvider(): Web3 {
  return new Web3(new Web3.providers.HttpProvider(optimismEndpoint))
}

// when testing locally and only running sdk (without running frontend) we should comment out this function because
// window object won't be available
function initRPCProvider(chainId: number): Web3 {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new Web3(window.ethereum)
  }
  if (chainId === 42161) {
    return initArbitrumProvider()
  } else if (chainId === 1) {
    return initMainnetProvider()
  }
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