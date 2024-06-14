import Web3 from 'web3'
import { CamelotHelperAbi } from '../abi/CamelotHelperAbi'

import initRPCProvider from '../../providers/RPCProvider'
import { CAMELOT_HELPER_ADDRESS as UNISWAP_HELPER_ADDRESS_MAINNET } from '../addresses-mainnet'
import { CAMELOT_HELPER_ADDRESS as UNISWAP_HELPER_ADDRESS_ARBITRUM } from '../addresses-arbitrum'

export function CreateCamelotHelperContract(chainId: number) {
    const web3: Web3 = initRPCProvider(chainId)

    if (chainId === 1) {
        return new web3.eth.Contract(CamelotHelperAbi, UNISWAP_HELPER_ADDRESS_MAINNET)
    } else {
        return new web3.eth.Contract(CamelotHelperAbi, UNISWAP_HELPER_ADDRESS_ARBITRUM)
    }
}
