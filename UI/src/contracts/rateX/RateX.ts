import { RateXAbi } from '../abi/RateXAbi'
import Web3 from 'web3'

import initRPCProvider from '../../providers/RPCProvider'
import { RATE_X_ADDRESS as RATE_X_ADDRESS_MAINNET } from '../addresses-mainnet'
import { RATE_X_ADDRESS as RATE_X_ADDRESS_ARBITRUM } from '../addresses-arbitrum'

export function CreateRateXContract(chainId: number) {
    const web3: Web3 = initRPCProvider(chainId)

    if (chainId === 1) {
        return new web3.eth.Contract(RateXAbi, RATE_X_ADDRESS_MAINNET)
    } else {
        return new web3.eth.Contract(RateXAbi, RATE_X_ADDRESS_ARBITRUM)
    }
}
