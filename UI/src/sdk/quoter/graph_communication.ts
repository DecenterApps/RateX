import { DEXGraphFunctionality, PoolInfo } from '../DEXGraphFunctionality';

let initializedDexes: DEXGraphFunctionality[] = []

async function initializeDexes(): Promise<void> {
    try {

        // IMPORTANT: for later -> go through folder and init every dex 
        // const files = await fs.promises.readdir('../sdk/dexes_graph')
        const files = ['SushiSwapV2.ts', 'UniswapV3.ts']
        for (const file of files) {
            if (file.endsWith('.ts')) {
                const module = await import(`../dexes_graph/${file}`)
                initializedDexes.push(module.default.initialize())
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
async function getPoolIdsForTokenPairs(token1: string, token2: string, numPools: number = 3): Promise<PoolInfo[]> {

    const poolsInfo: PoolInfo[] = []
    
    if (initializedDexes.length === 0) {
        await initializeDexes()
    }

    for (const dex of initializedDexes) {
        const poolInfo = await dex.matchBothTokens(token1, token2, numPools);
        poolsInfo.push(...poolInfo.map((pool: any): PoolInfo => {
            return {
                poolId: pool.poolId,
                dexId: pool.dexId,
                token0: pool.token0,
                token1: pool.token1,
            } as PoolInfo;
        }));
    }

    return poolsInfo;
}

/* Get pools from each dex in initializedDexes list that have token as one of the tokens in the pool
    * @param token: token address to match (for now the chain is Arbitrum -> param for the future)
    * @param numPools: number of pools to return from each dex
    * @param amountIn: amount of token1 to swap (in wei) - currently unused
    * @returns: list of poolIds
*/
async function getPoolIdsForToken(token: string, numPools: number = 5): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []

    for (const dex of initializedDexes) {
        const poolInfo = await dex.matchOneToken(token, numPools);
        poolsInfo.push(...poolInfo.map((pool: any): PoolInfo => {
            return {
                poolId: pool.poolId,
                dexId: pool.dexId,
                token0: pool.token0,
                token1: pool.token1,
            } as PoolInfo;
        }));
    }

    return poolsInfo;
}

/* Get top pools from each dex in initializedDexes list - returns a list of poolIds
    * @param numPools: number of pools to return from each dex
    * @param amountIn: amount of token1 to swap (in wei) - currently unused
    * @returns: list of poolIds
*/
async function getTopPools(numPools: number = 5): Promise<PoolInfo[]> {

    const poolsInfo: PoolInfo[] = []
    for (const dex of initializedDexes) {
        const topPoolsIdsOneDex = await dex.topPools(numPools)
        poolsInfo.push(...topPoolsIdsOneDex.map((pool: any): PoolInfo => {
            return {
                poolId: pool.poolId,
                dexId: pool.dexId,
                token0: pool.token0,
                token1: pool.token1,
            } as PoolInfo;
        }));
    }

    return poolsInfo;
}

async function fetchPoolsData(tokenFrom: string, tokenTo: string): Promise<PoolInfo[]> {
    const numPools: number = 5
    const poolsInfo: PoolInfo[] = []
    if (initializedDexes.length === 0)
        await initializeDexes()

    poolsInfo.push(...await getPoolIdsForToken(tokenFrom, numPools))
    poolsInfo.push(...await getPoolIdsForToken(tokenTo, numPools))
    poolsInfo.push(...await getTopPools(numPools));

    return poolsInfo;
}

export { getTopPools, fetchPoolsData, getPoolIdsForToken, getPoolIdsForTokenPairs, initializeDexes }