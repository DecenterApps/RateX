import { get } from 'http'
import { DEXGraphFunctionality } from '../DEXGraphFunctionality'
import { Pool, PoolInfo } from '../types'

let initializedDexes: DEXGraphFunctionality[] = []
let initialized = false
let dexesPools: Map<DEXGraphFunctionality, PoolInfo[]> = new Map<DEXGraphFunctionality, PoolInfo[]>()

async function initializeDexes(): Promise<void> {
  try {
    // IMPORTANT: for later -> go through folder and init every dex
    // const files = await fs.promises.readdir('../sdk/dexes_graph')
    const files = ['SushiSwapV2.ts', 'UniswapV3.ts', 'Curve.ts', 'CamelotV2.ts', 'BalancerV2.ts']
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

async function checkInitializedDexes() {
  if (!initialized) {
    await initializeDexes()
    initialized = true
  }
}

/* returns dictionary of dexes and their poolIds for token1 and token2:
 *   UniswapV3: [poolId1, poolId2, ...],
 *   SushiSwapV2: [poolId1, poolId2, ...]
 */
async function getPoolIdsForTokenPairs(tokenA: string, tokenB: string, numPools: number = 3): Promise<void> {
  await checkInitializedDexes()
  
  const allPoolsPromises = initializedDexes.map((dex) => dex.getPoolsWithTokenPair(tokenA, tokenB, numPools))
  const allPoolsResults = await Promise.all(allPoolsPromises)

  initializedDexes.forEach((dex, index) => {
    const pools = allPoolsResults[index]
    if (dexesPools.has(dex)) {
      dexesPools.get(dex)?.push(...pools)
    } else {
      dexesPools.set(dex, pools)
    }
  })
}

/* Get pools from each dex in initializedDexes list that have token as one of the tokens in the pool
 * @param token: token address to match (for now the chain is Arbitrum -> param for the future)
 * @param numPools: number of pools to return from each dex
 * @param amountIn: amount of token1 to swap (in wei) - currently unused
 * @returns: list of poolIds
 */
async function getPoolIdsForToken(token: string, numPools: number = 5): Promise<void> {
  await checkInitializedDexes()
  
  const allPoolsPromises = initializedDexes.map((dex) => dex.getPoolsWithToken(token, numPools))
  const allPoolsResults = await Promise.all(allPoolsPromises)

  initializedDexes.forEach((dex, index) => {
    const pools = allPoolsResults[index]
    if (dexesPools.has(dex)) {
      dexesPools.get(dex)?.push(...pools)
    } else {
      dexesPools.set(dex, pools)
    }
  })
}

/* Get top pools from each dex in initializedDexes list - returns a list of poolIds
 * @param numPools: number of pools to return from each dex
 * @param amountIn: amount of token1 to swap (in wei) - currently unused
 * @returns: list of poolIds
 */
async function getTopPools(numPools: number = 5): Promise<void> {
  await checkInitializedDexes()
  
  const allPoolsPromises = initializedDexes.map((dex) => dex.getTopPools(numPools))
  const allPoolsResults = await Promise.all(allPoolsPromises)

  initializedDexes.forEach((dex, index) => {
    const pools = allPoolsResults[index]
    if (dexesPools.has(dex)) {
      dexesPools.get(dex)?.push(...pools)
    } else {
      dexesPools.set(dex, pools)
    }
  })
}

async function fetchPoolsData(tokenFrom: string, tokenTo: string, numFromToPools: number = 5, numTopPools: number = 5): Promise<Pool[]> {
  let pools: Pool[] = []
  dexesPools.forEach((poolInfos: PoolInfo[], dex: DEXGraphFunctionality) => {
    dexesPools.set(dex, [])
  })

  await checkInitializedDexes()

  const promises: Promise<void>[] = []
  promises.push(getPoolIdsForToken(tokenFrom, numFromToPools))
  promises.push(getPoolIdsForToken(tokenTo, numFromToPools))
  promises.push(getTopPools(numTopPools))
  promises.push(getPoolIdsForTokenPairs(tokenFrom, tokenTo, numFromToPools))
  await Promise.all(promises)

  filterDuplicatePools()

  const dexPoolsPromises: Promise<Pool[]>[] = []
  for (let [dex, poolInfos] of dexesPools.entries()) {
    dexPoolsPromises.push(dex.getPoolsData(poolInfos))
  }
  const allPoolsData = await Promise.all(dexPoolsPromises)
  allPoolsData.forEach((poolsData: Pool[]) => {
    pools.push(...poolsData)
  })

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