import { DEXGraphFunctionality } from '../DEXGraphFunctionality'
import { Pool, PoolInfo } from '../types'

let initializedDexes: DEXGraphFunctionality[] = []
let initialized = false
let dexesPools: Map<DEXGraphFunctionality, PoolInfo[]> = new Map<DEXGraphFunctionality, PoolInfo[]>()

async function initializeDexes(): Promise<void> {
  try {
    // IMPORTANT: for later -> go through folder and init every dex
    // const files = await fs.promises.readdir('../sdk/dexes_graph')
    const files = ['SushiSwapV2.ts']
    for (const file of files) {
      if (file.endsWith('.ts')) {
        const module = await import(`../dexes/graph_queries/${file}`)
        const dex: DEXGraphFunctionality = module.default.initialize()
        initializedDexes.push(dex)
        dexesPools.set(dex, [])
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
async function getPoolIdsForTokenPairs(tokenA: string, tokenB: string, numPools: number = 3): Promise<void> {
  for (const dex of initializedDexes) {
    const pools = await dex.getPoolsWithTokenPair(tokenA, tokenB, numPools)
    dexesPools.get(dex)?.push(...pools)
  }
}

/* Get pools from each dex in initializedDexes list that have token as one of the tokens in the pool
 * @param token: token address to match (for now the chain is Arbitrum -> param for the future)
 * @param numPools: number of pools to return from each dex
 * @param amountIn: amount of token1 to swap (in wei) - currently unused
 * @returns: list of poolIds
 */
async function getPoolIdsForToken(token: string, numPools: number = 5): Promise<void> {
  for (const dex of initializedDexes) {
    const pools = await dex.getPoolsWithToken(token, numPools)
    dexesPools.get(dex)?.push(...pools)
  }
}

/* Get top pools from each dex in initializedDexes list - returns a list of poolIds
 * @param numPools: number of pools to return from each dex
 * @param amountIn: amount of token1 to swap (in wei) - currently unused
 * @returns: list of poolIds
 */
async function getTopPools(numPools: number = 5): Promise<void> {
  for (const dex of initializedDexes) {
    const pools = await dex.getTopPools(numPools)
    dexesPools.get(dex)?.push(...pools)
  }
}

async function fetchPoolsData(tokenFrom: string, tokenTo: string, numFromToPools: number = 5, numTopPools: number = 5): Promise<Pool[]> {
  let pools: Pool[] = []

  if (!initialized) {
    await initializeDexes()
    initialized = true
  }

  await getPoolIdsForToken(tokenFrom, numFromToPools)
  await getPoolIdsForToken(tokenTo, numFromToPools)
  await getTopPools(numTopPools)

  filterDuplicatePools()

  for (let [dex, poolInfos] of dexesPools.entries()) {
    const dexPools = await dex.getPoolsData(poolInfos)
    pools.push(...dexPools)
  }

  return pools
}

function filterDuplicatePools(): void {
  dexesPools.forEach((poolInfos: PoolInfo[], dex: DEXGraphFunctionality, self) => {
    const filteredPoolInfos = poolInfos.filter((poolInfo: PoolInfo, index: number, allPoolInfos: PoolInfo[]) => {
      return allPoolInfos.findIndex((pool2) => pool2.poolId === poolInfo.poolId) === index
    })
    self.set(dex, filteredPoolInfos)
  })
}

export { fetchPoolsData, getPoolIdsForToken, getPoolIdsForTokenPairs }
