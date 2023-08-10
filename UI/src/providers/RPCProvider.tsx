import Web3 from 'web3'
import { ALCHEMY_KEY } from './keys'

// Private keys from the provider/keys.tsx file (not included in the repo)

// Arbitrum Endpoints
const abritrumOneEndpoint = 'https://arb1.arbitrum.io/rpc'
const alchemyMainnetEndpoint = `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`

// Optimism Endpoints
const optimismEndpoint = 'https://mainnet.optimism.io'

function initArbitrumProvider(): Web3 {
  try {
    return new Web3(new Web3.providers.HttpProvider(abritrumOneEndpoint))
  } catch (error) {
    return new Web3(new Web3.providers.HttpProvider(alchemyMainnetEndpoint))
  }
}

function initOptimismProvider(): Web3 {
  return new Web3(new Web3.providers.HttpProvider(optimismEndpoint))
}

function initRPCProvider(chainId: number): Web3 {
  // check if metamask is connected
  if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) return new Web3(window.ethereum)
  else if (chainId === 42161) return initArbitrumProvider()
  else return initOptimismProvider()
}

export default initRPCProvider
