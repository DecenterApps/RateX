import { PoolInfo } from "../DEXGraphFunctionality"

// In future will have chainId
export type AdditionalPoolInfo = {
    poolId: string
    dexId: string
    token0: string         // address
    token1: string         // address
    reserve0: bigint       // in wei
    reserve1: bigint       // in wei
    fee: number          
}

async function getAdditionalPoolInfo(poolsInfo: PoolInfo[]): Promise<AdditionalPoolInfo[]> {
    
    const additionalPoolsInfo: AdditionalPoolInfo[] = []

    // TO-DO: calls to Solidity

    return additionalPoolsInfo
}

export { getAdditionalPoolInfo } 