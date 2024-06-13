import { SushiSwapHelperAbi } from '../abi/SushiSwapHelperAbi'
import Web3 from 'web3'

import initRPCProvider from '../../providers/RPCProvider'
import { SUSHISWAP_HELPER_ADDRESS as SUSHISWAP_HELPER_ADDRESS_MAINNET } from '../addresses-mainnet'
import { SUSHISWAP_HELPER_ADDRESS as SUSHISWAP_HELPER_ADDRESS_ARBITRUM } from '../addresses-arbitrum'

export function CreateSushiSwapHelperContract(chainId: number) {
  const web3: Web3 = initRPCProvider(chainId)

  if (chainId === 1) {
    return new web3.eth.Contract(SushiSwapHelperAbi, SUSHISWAP_HELPER_ADDRESS_MAINNET)
  } else {
    return new web3.eth.Contract(SushiSwapHelperAbi, SUSHISWAP_HELPER_ADDRESS_ARBITRUM)
  }
}
