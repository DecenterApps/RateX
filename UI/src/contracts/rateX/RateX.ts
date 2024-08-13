import { RateXAbi } from '../abi/RateXAbi'
import Web3 from 'web3'

import initRPCProvider from '../../providers/RPCProvider'

export function CreateRateXContract(chainId: number) {
    const web3: Web3 = initRPCProvider()
    const RATE_X_ADDRESS = chainId === 1 ? '0x60CDfe555Fd87Ae585bC96a5F692CFeF47dD9006' : '0xD2cfA0790CcE7dd980699F6F1F4A4f1D13cEBA9F'

    return new web3.eth.Contract(RateXAbi, RATE_X_ADDRESS)
}
