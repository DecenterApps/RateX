import initRPCProvider from "../../providers/RPCProvider"
import findBestOneHopRoute from "../routing/oneHopSwap"
import {RateXContract} from "../../contracts/RateX";
import {getPoolIdsForTokenPairs} from "./graph_communication";
import {PoolInfo} from "../DEXGraphFunctionality";
import {PoolEntry, QuoteResultEntry} from "../types";


// called by the UI
async function initGetQuote(token1: string, token2: string, tokenOneAmount: bigint, chainId: number): Promise<bigint> {
    
    // call functions that compare different routes
    //findBestOneHopRoute(token1, token2, tokenOneAmount, chainId)

    const pools: PoolInfo[] =  await getPoolIdsForTokenPairs(token1, token2, 3);
    const poolEntries: PoolEntry[] = pools.map((p: PoolInfo) => new PoolEntry(p.poolId, p.dexId))

    console.log("poolEntries size: ", poolEntries.length);

    //@ts-ignore
    const result: QuoteResultEntry[] = await RateXContract.methods.quoteV2(poolEntries, token1, token2, tokenOneAmount)
        .call().catch((err: any) => {
            console.log("error: ", err)
        });

    // just do a simple max for now, no need to check for liquidity of the pool
    const bestPool = result.reduce((prev, current) => {
        return (prev.amountOut > current.amountOut) ? prev : current
    })

    const web3 = initRPCProvider(chainId)
    return web3.utils.toBigInt(bestPool.amountOut)
}

export { initGetQuote}