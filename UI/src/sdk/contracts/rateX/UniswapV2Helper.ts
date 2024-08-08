import Web3 from 'web3'
import { UniswapV2HelperAbi } from '../abi/UniswapV2HelperAbi'

import { UNISWAP_V2_HELPER_ADDRESS as UNISWAP_V2_HELPER_ADDRESS_MAINNET } from '../addresses-mainnet'
import { UNISWAP_V2_HELPER_ADDRESS as UNISWAP_V2_HELPER_ADDRESS_ARBITRUM } from '../addresses-arbitrum'

export function CreateUniswapV2HelperContract(chainId: number, web3: Web3) {
  if (chainId === 1) {
    return new web3.eth.Contract(UniswapV2HelperAbi, UNISWAP_V2_HELPER_ADDRESS_MAINNET)
  } else {
    return new web3.eth.Contract(UniswapV2HelperAbi, UNISWAP_V2_HELPER_ADDRESS_ARBITRUM)
  }
}
