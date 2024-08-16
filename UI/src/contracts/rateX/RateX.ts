import { RateXAbi } from '../abi/RateXAbi'
import Web3 from 'web3'

import initRPCProvider from '../../providers/RPCProvider'

export function CreateRateXContract(chainId: number) {
  const web3: Web3 = initRPCProvider()
  const RATE_X_ADDRESS = chainId === 1 ? '0xb9E24094d0899Ca4BF6FC210bD4Ee7DE7bee81CB' : '0x9DdA81Aa5FeB4a4972b62265C43dee305B360372'

  return new web3.eth.Contract(RateXAbi, RATE_X_ADDRESS)
}
