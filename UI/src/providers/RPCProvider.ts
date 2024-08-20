import { ethers } from 'ethers'

function initRPCProvider(): { provider: ethers.BrowserProvider | ethers.JsonRpcProvider; isFallback: boolean } {
  if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
    return { provider: new ethers.BrowserProvider(window.ethereum), isFallback: false }
  } else {
    const fallbackRpcUrl = 'https://eth-mainnet.g.alchemy.com/v2/demo'
    return { provider: new ethers.JsonRpcProvider(fallbackRpcUrl), isFallback: true }
  }
}

export default initRPCProvider
