import { BalancerHelperAbi } from '../abi/BalancerHelperAbi'
import Web3 from 'web3'

import { BALANCER_HELPER_ADDRESS as BALANCER_HELPER_ADDRESS_MAINNET } from '../addresses-mainnet'
import { BALANCER_HELPER_ADDRESS as BALANCER_HELPER_ADDRESS_ARBITRUM } from '../addresses-arbitrum'

export function CreateBalancerHelperContract(chainId: number, web3: Web3) {
  if (chainId === 1) {
    return new web3.eth.Contract(BalancerHelperAbi, BALANCER_HELPER_ADDRESS_MAINNET)
  } else {
    return new web3.eth.Contract(BalancerHelperAbi, BALANCER_HELPER_ADDRESS_ARBITRUM)
  }
}
