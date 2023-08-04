import { DEXFunctionality } from "./DEXFunctionalityIF"
import { SushiSwapV2 } from "./dexes/SushiSwapV2"
import {RateXContract} from "../../contracts/RateX";
import Web3 from "web3";
import initRPCProvider from "../../providers/RPCProvider";
const web3: Web3 = initRPCProvider(42161);

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

async function initGetQuote(token1: string, token2: string, tokenOneAmount: bigint): Promise<void> {
    // @ts-ignore
    const res = await RateXContract.methods.quote("SUSHI_V2", token1, token2, tokenOneAmount)
        .call({}).catch((error) => {
            console.log(error);
        });
    console.log(res);
}

export { getTopPools, initGetQuote }