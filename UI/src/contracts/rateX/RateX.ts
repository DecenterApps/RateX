import { RateXAbi } from '../abi/RateXAbi'
import Web3 from 'web3'

import initRPCProvider from '../../providers/RPCProvider'

export function CreateRateXContract(chainId: number) {
    const web3: Web3 = initRPCProvider()
    const RATE_X_ADDRESS = chainId === 1 ? '0xf682AB178cC65f48E68DfdfD376E9D1f055B8Cd4' : '0x10400dd38061186DEa9E5b2683d527A48E153ca2'

    return new web3.eth.Contract(RateXAbi, RATE_X_ADDRESS)
}
