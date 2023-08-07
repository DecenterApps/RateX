import { DEXGraphFunctionality } from '../DEXGraphFunctionality';
import initRPCProvider from "../../providers/RPCProvider";

const initializedDexes: DEXGraphFunctionality[] = []
const topPoolsIds: string[] = []
type DexPool = {
    poolId: string;
    dexId: string;
    token0: string;
    token1: string;
    amountIn: number;
};

async function initializeDexes(): Promise<void> {
    try {
        // IMPORTANT: for later -> go through folder and init every dex 
        // const files = await fs.promises.readdir('../sdk/dexes_graph')
        const files = ['SushiSwapV2.ts', 'UniswapV3.ts']
        for (const file of files) {
            if (file.endsWith('.ts')) {
                const module = await import(`../dexes_graph/${file}`)
                initializedDexes.push(module.default.initialise())
            }
        }
    } catch (err) {
        console.error('Error reading directory dexes_graph:', err);
    }
}

/* returns dictionary of dexes and their poolIds for token1 and token2:
*   UniswapV3: [poolId1, poolId2, ...],
*   SushiSwapV2: [poolId1, poolId2, ...]
*/
async function getPoolIdsForTokenPairs(token1: string, token2: string): Promise<DexPool[]> {

    const dexPools: DexPool[] = []
    
    for (const dex of initializedDexes) {
        const poolInfo = await dex.matchBothTokens(token1, token2, 3);
        dexPools.push(...poolInfo.map((pool: any): DexPool => {
            return {
                poolId: pool.poolId,
                dexId: pool.dexId,
                token0: pool.token0,
                token1: pool.token1,
                amountIn: -1
            } as DexPool;
        }));
    }

    return dexPools;
}

async function getPoolIdsForToken(token: string, numPools: number = 5): Promise<DexPool[]> {
    const dexPools: DexPool[] = []

    for (const dex of initializedDexes) {
        const poolInfo = await dex.matchOneToken(token, numPools);
        dexPools.push(...poolInfo.map((pool: any): DexPool => {
            return {
                poolId: pool.poolId,
                dexId: pool.dexId,
                token0: pool.token0,
                token1: pool.token1,
                amountIn: -1
            } as DexPool;
        }));
    }

    return dexPools;
}

async function getTopPools(numPools: number = 5): Promise<DexPool[]> {
    /* 
    // Get top pools from each dex in initializedDexes list
    initializedDexes.forEach(async (dex) => {
        const topPoolsIdsOneDex = await dex.topPools()
        topPoolsIds.push(...topPoolsIdsOneDex)
    })
    */

    const dexPools: DexPool[] = []
    // Get top pools from each dex in initializedDexes list
    for (const dex of initializedDexes) {
        const topPoolsIdsOneDex = await dex.topPools(numPools)
        dexPools.push(...topPoolsIdsOneDex.map((pool: any): DexPool => {
            return {
                poolId: pool.poolId,
                dexId: pool.dexId,
                token0: pool.token0,
                token1: pool.token1,
                amountIn: -1
            } as DexPool;
        }));
    }

    return dexPools;
}

async function fetchPoolsData(tokenFrom: string, tokenTo: string, amountIn: number): Promise<DexPool[]> {
    const numPools: number = 5
    const dexPools: DexPool[] = []
    await initializeDexes()

    dexPools.push(...await getPoolIdsForToken(tokenFrom, numPools))
    dexPools.push(...await getPoolIdsForToken(tokenTo, numPools))
    dexPools.push(...await getTopPools(numPools));

    // define amountIn for every dexPool
    dexPools.forEach((pool) => {
        pool.amountIn = amountIn;
    })

    return dexPools;
}

async function initGetQuote(token1: string, token2: string, tokenOneAmount: bigint, chainId: number): Promise<bigint> {
    /* 
    initializeDexes()
    const dexPoolIds = await getPoolIdsForTokens(token1, token2)
    */

    const web3 = initRPCProvider(chainId)
    return web3.utils.toBigInt(0)
}

export { getTopPools, initGetQuote, fetchPoolsData }