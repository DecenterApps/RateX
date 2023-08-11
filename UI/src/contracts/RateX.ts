import { RateXAbi } from './RateXAbi'
import Web3 from 'web3'

import initRPCProvider from '../providers/RPCProvider'

const web3: Web3 = initRPCProvider(42161)
export const rateXAddress: string = '0x370d700300176e8a3A0A2aA6486c44Be60b3faa6'

export const RateXContract = new web3.eth.Contract(RateXAbi, rateXAddress)
