import { ethers } from 'ethers'

function initRPCProvider(): ethers.BrowserProvider {
  if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
    return new ethers.BrowserProvider(window.ethereum)
  }
  throw new Error('Install metamask')
}

export default initRPCProvider
