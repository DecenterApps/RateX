import { DEXFunctionality } from "./DEXFunctionalityIF"
import { SushiSwapV2 } from "./dexes/SushiSwapV2"

const initialisedDexes: DEXFunctionality[] = []
const topPoolsIds: string[] = []

function getTopPools(): void {

    // TO-DO: go through files in ./dexes and initialise each dex -> add to initialisedDexes list

    // for now: just initialise SushiSwapV2
    const sushiSwap = new SushiSwapV2()
    initialisedDexes.push(sushiSwap)

    // Get top pools from each dex in initialisedDexes list
    initialisedDexes.forEach(async (dex) => {
        const topPoolsIdsOneDex = await dex.topPools()
        topPoolsIds.push(...topPoolsIdsOneDex)
    })
}

function getAdditionalPools(): void {

}

async function initGetQuote(token1: string, token2: string, tokenOneAmount: number, slippage: number): Promise<void> {

    // TO-DO: get additional pools from each dex in initialisedDexes list

    // for now: send addresses of 2 tokens to our contract
    // returns: reserve1, reserve2, expectedAmountOut
    initialisedDexes.forEach(async (dex) => {
        const poolIds = await dex.matchBothTokens(token1, token2)
        console.log(poolIds)
    })
}

export { getTopPools, initGetQuote }