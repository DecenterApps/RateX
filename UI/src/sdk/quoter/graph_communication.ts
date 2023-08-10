import { DEXGraphFunctionality, PoolInfo } from '../DEXGraphFunctionality'

let initializedDexes: DEXGraphFunctionality[] = []
let initialized = false

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
    console.error('Error reading directory dexes_graph:', err)
  }
}

/* returns dictionary of dexes and their poolIds for token1 and token2:
 *   UniswapV3: [poolId1, poolId2, ...],
 *   SushiSwapV2: [poolId1, poolId2, ...]
 */
async function getPoolIdsForTokenPairs(tokenA: string, tokenB: string, numPools: number = 3): Promise<PoolInfo[]> {
  const poolsInfo: PoolInfo[] = []

  for (const dex of initializedDexes) {
    const pools = await dex.getPoolsWithTokenPair(tokenA, tokenB, numPools)
    poolsInfo.concat(pools)
  }

  return poolsInfo
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
    const pools = await dex.getPoolsWithToken(token, numPools)
    poolsInfo.concat(pools)
  }

  return poolsInfo
}

/* Get top pools from each dex in initializedDexes list - returns a list of poolIds
 * @param numPools: number of pools to return from each dex
 * @param amountIn: amount of token1 to swap (in wei) - currently unused
 * @returns: list of poolIds
 */
async function getTopPools(numPools: number = 5): Promise<PoolInfo[]> {
  const poolsInfo: PoolInfo[] = []

  for (const dex of initializedDexes) {
    const pools = await dex.getTopPools(numPools)
    poolsInfo.concat(pools)
  }

  return poolsInfo
}

async function fetchPoolsData(tokenFrom: string, tokenTo: string, numPools: number = 5): Promise<PoolInfo[]> {
  const poolsInfo: PoolInfo[] = []

  if (!initialized) {
    await initializeDexes()
    initialized = true
  }

  const poolsFrom = await getPoolIdsForToken(tokenFrom, numPools)
  const poolsTo = await getPoolIdsForToken(tokenTo, numPools)
  const topPools = await getTopPools(numPools)

  poolsInfo.concat(poolsFrom, poolsTo, topPools)

  return poolsInfo
}

export { fetchPoolsData }
