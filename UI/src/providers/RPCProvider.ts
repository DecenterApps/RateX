import Web3 from 'web3'

const ALCHEMY_KEY = process.env.ALCHEMY_KEY
const TENDERLY_FORK_ID = process.env.TENDERLY_FORK_ID

// Arbitrum Endpoints
const abritrumOneEndpoint = 'https://arb1.arbitrum.io/rpc'
const alchemyMainnetEndpoint = `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
const tenderlyForkEndpoint: string = `https://rpc.tenderly.co/fork/${TENDERLY_FORK_ID}`

// FOR NOW WE CAN USE IT LIKE THIS
const USE_TENDERLKLY_FORK = false

// Optimism Endpoints
const optimismEndpoint = 'https://mainnet.optimism.io'

function initArbitrumProvider(): Web3 {
  if (USE_TENDERLKLY_FORK) {
    return new Web3(new Web3.providers.HttpProvider(tenderlyForkEndpoint))
  } else {
    try {
      return new Web3(new Web3.providers.HttpProvider(abritrumOneEndpoint))
    } catch (error) {
      return new Web3(new Web3.providers.HttpProvider(alchemyMainnetEndpoint))
    }
  }
}

function initOptimismProvider(): Web3 {
  return new Web3(new Web3.providers.HttpProvider(optimismEndpoint))
}

// when testing locally and only running sdk (without running frontend) we should comment out this function because
// window object won't be avaialble in node
function initRPCProvider(chainId: number): Web3 {
  // check if metamask is connected
  if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) return new Web3(window.ethereum)
  else if (chainId === 42161) return initArbitrumProvider()
  else return initOptimismProvider()
}

// test method for running sdk locally
// function initRPCProvider(chainId: number): Web3 {
//   return initArbitrumProvider();
// }


export function initLocalHardhatProvider(): Web3 {
  return new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8545'))
}

export default initRPCProvider
