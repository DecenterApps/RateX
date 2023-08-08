import { getPoolIdsForToken } from "../quoter/graph_communication"
import { PoolInfo } from "../DEXGraphFunctionality"
import { getAdditionalPoolInfo, AdditionalPoolInfo } from "../quoter/solidity_communication"

/* Function to find the best one hop route between two tokens
    * @param tokenOneAmount: the amount of token1 to be swapped (expressed in wei)
    * @param chainId: the chainId of the current L2 chain
*/
async function findBestOneHopRoute(tokenIn: string, tokenOut: string, amountIn: bigint, chainId: number): Promise<any> {

    // Graph
    const topPoolsIn: PoolInfo[] = await getPoolIdsForToken(tokenIn, 5);
    const topPoolsOut: PoolInfo[] = await getPoolIdsForToken(tokenOut, 5);

    const combinedTopPoolsIds = [...topPoolsIn, ...topPoolsOut];
    const poolsAdditionalInfo = await getAdditionalPoolInfo(combinedTopPoolsIds);

    // Divide additionalPoolsInfo back into 2 lists based on poolId - better than to call Solidity 2 times
    let list0: AdditionalPoolInfo[] = []
    let list1: AdditionalPoolInfo[] = []

    for (const poolInfo of topPoolsIn) {
        const matchingAdditionalInfo = poolsAdditionalInfo.find(additionalInfo => additionalInfo.poolId === poolInfo.poolId);
        if (matchingAdditionalInfo)
            list0.push({...matchingAdditionalInfo})
    }
    
    for (const poolInfo of topPoolsOut) {
        const matchingAdditionalInfo = poolsAdditionalInfo.find(additionalInfo => additionalInfo.poolId === poolInfo.poolId);
        if (matchingAdditionalInfo) 
            list1.push({...matchingAdditionalInfo})
    }

    /* NOT REALLY NEEDED 
    // Remove pools from list0 that cannot be paired with any pool from list1 and the other way around
    list0 = list0.filter(item0 => list1.some(item1 => item1.token0 === item0.token1))
    list1 = list1.filter(item1 => list0.some(item0 => item0.token1 === item1.token0))

    // Remove pools from list0 and list1 that have a lower reserve1 than the amountIn
    list0 = list0.filter(item0 => item0.reserve0 > amountIn)
    list1 = list1.filter(item1 => item1.reserve1 > amountIn)
    */

    // Calculate the expected output amount for each pair of pools
    const expectedOutputAmounts: bigint[] = []
    for (const item0 of list0) {
        for (const item1 of list1) {
            const expectedOutputAmount = calculateExpectedOutputAmount(amountIn, item0.reserve0, item1.reserve1, item0.fee)
            expectedOutputAmounts.push(expectedOutputAmount)
        }
    }

    // Find pool0 with best expected output amount
    const maxExpectedOutputAmount0 = expectedOutputAmounts.reduce((max, value) => value > max ? value : max, BigInt(0))
    const bestPoolIndex0 = expectedOutputAmounts.findIndex(amount => amount === maxExpectedOutputAmount0)

    // Find pool1 with best expected output amount (only for the pools that have the same input token as the best pool0 output token)
    const bestIntermediaryToken = list0[bestPoolIndex0].token1
    list1 = list1.filter(item1 => item1.token0 === bestIntermediaryToken)
    const maxExpectedOutputAmount1 = expectedOutputAmounts.reduce((max, value) => value > max ? value : max, BigInt(0))
    const bestPoolIndex1 = expectedOutputAmounts.findIndex(amount => amount === maxExpectedOutputAmount1)

    // Return the best route
    return [list0[bestPoolIndex0], list1[bestPoolIndex1]]
}   

/* Function to calculate the expected output amount of a swap through a pool (amounts are expressed in wei)
    * @param fee: the fee of the pool (for Uniswap V2 it is fixed to 0.003)
    * @returns: the expected output amount of the swap (expressed in wei)
*/
function calculateExpectedOutputAmount(amount1: bigint, reserve1: bigint, reserve2: bigint, fee: number = 0.003): bigint {
    const k = reserve1 * reserve2
    const amount2 = reserve2 - k / (reserve1 + amount1)
    const price = amount2 * BigInt((1 - fee))
    return price
}

export default findBestOneHopRoute