import { CurveHelperAbi } from '../abi/CurveHelperAbi'
import Web3 from 'web3'

import { CURVE_HELPER_ADDRESS as CURVE_HELPER_ADDRESS_MAINNET } from '../addresses-mainnet'
import { CURVE_HELPER_ADDRESS as CURVE_HELPER_ADDRESS_ARBITRUM } from '../addresses-arbitrum'

export function CreateCurveHelperContract(chainId: number, web3: Web3) {
  if (chainId === 1) {
    return new web3.eth.Contract(CurveHelperAbi, CURVE_HELPER_ADDRESS_MAINNET)
  } else {
    return new web3.eth.Contract(CurveHelperAbi, CURVE_HELPER_ADDRESS_ARBITRUM)
  }
}
