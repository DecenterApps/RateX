import { Pool, Route, Swap, Token } from '../types'

type DpInfo = {
  amountOut: bigint
  path: string[]
  swaps: Swap[]
}

const max_hops = 4

function multiHopSwap(amountIn: bigint, tokenIn: string, tokenOut: string, graph: Map<string, Pool[]>): Route {
  // dp[hop][token]
  const dp: Map<number, Map<string, DpInfo>> = new Map<number, Map<string, DpInfo>>()
  dp.set(0, new Map<string, DpInfo>())
  dp.get(0)?.set(tokenIn, { amountOut: amountIn, path: [tokenIn], swaps: [] })

  const res: DpInfo = { amountOut: BigInt(-1), path: [], swaps: [] }

  for (let hop = 0; hop < max_hops - 1; hop++) {
    dp.get(hop)?.forEach((dpInfo: DpInfo, tokenA: string) => {
      graph.get(tokenA)?.forEach((pool: Pool) => {
        pool.tokens.forEach((tokenB: Token) => {
          if (dpInfo.path.includes(tokenB._address)) {
            return
          }

          const amountOut: bigint = pool.calculateExpectedOutputAmount(tokenA, tokenB._address, dpInfo.amountOut)
          const newPath: string[] = [...dpInfo.path, tokenB._address]
          const currSwap: Swap = { poolId: pool.poolId, dexId: pool.dexId, tokenA: tokenA, tokenB: tokenB._address }
          const newSwaps: Swap[] = [...dpInfo.swaps, currSwap]

          if (!dp.has(hop + 1)) {
            dp.set(hop + 1, new Map<string, DpInfo>())
          }

          const dpEntry = dp.get(hop + 1)

          if (!dpEntry?.has(tokenB._address)) {
            dp.get(hop + 1)?.set(tokenB._address, { amountOut: amountOut, path: newPath, swaps: newSwaps })
          } else if (amountOut > (dpEntry?.get(tokenB._address)?.amountOut || 0)) {
            dp.get(hop + 1)?.set(tokenB._address, { amountOut: amountOut, path: newPath, swaps: newSwaps })
          }
        })
      })
    })

    if (dp.get(hop + 1)?.has(tokenOut) && (dp.get(hop + 1)?.get(tokenOut)?.amountOut || -1) > res.amountOut) {
      res.amountOut = dp.get(hop + 1)?.get(tokenOut)?.amountOut || BigInt(0)
      res.path = dp.get(hop + 1)?.get(tokenOut)?.path || []
      res.swaps = dp.get(hop + 1)?.get(tokenOut)?.swaps || []
    }
  }

  return { swaps: res.swaps, amountOut: res.amountOut, percentage: 100 }
}

function createGraph(pools: Pool[]): Map<string, Pool[]> {
  const graph: Map<string, Pool[]> = new Map<string, Pool[]>()
  for (let pool of pools) {
    const poolId = pool.poolId

    for (let token of pool.tokens) {
      if (!graph.has(token._address)) {
        graph.set(token._address, [])
      }
      graph.get(token._address)?.push(pool)
    }
  }

  return graph
}

export { multiHopSwap, createGraph }
