import { UniswapHelperAbi } from '../abi/UniswapHelperAbi'
import Web3 from 'web3'

import { UNISWAP_HELPER_ADDRESS as UNISWAP_HELPER_ADDRESS_MAINNET } from '../addresses-mainnet'
import { UNISWAP_HELPER_ADDRESS as UNISWAP_HELPER_ADDRESS_ARBITRUM } from '../addresses-arbitrum'

export function CreateUniswapHelperContract(chainId: number, web3: Web3) {
  if (chainId === 1) {
    return new web3.eth.Contract(UniswapHelperAbi, UNISWAP_HELPER_ADDRESS_MAINNET)
  } else {
    return new web3.eth.Contract(UniswapHelperAbi, UNISWAP_HELPER_ADDRESS_ARBITRUM)
  }
}
