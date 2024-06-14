import { UniswapHelperAbi } from '../abi/UniswapHelperAbi'
import Web3 from 'web3'

import initRPCProvider from '../../providers/RPCProvider'
import { UNISWAP_HELPER_ADDRESS as UNISWAP_HELPER_ADDRESS_MAINNET } from '../addresses-mainnet'
import { UNISWAP_HELPER_ADDRESS as UNISWAP_HELPER_ADDRESS_ARBITRUM } from '../addresses-arbitrum'

export function CreateUniswapHelperContract(chainId: number) {
  const web3: Web3 = initRPCProvider(chainId)

  if (chainId === 1) {
    return new web3.eth.Contract(UniswapHelperAbi, UNISWAP_HELPER_ADDRESS_MAINNET)
  } else {
    return new web3.eth.Contract(UniswapHelperAbi, UNISWAP_HELPER_ADDRESS_ARBITRUM)
  }
}
