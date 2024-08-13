import Web3 from 'web3'

function initRPCProvider(): Web3 {
  if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
    return new Web3(window.ethereum)
  }
  throw new Error("Install metamask")
}

export default initRPCProvider