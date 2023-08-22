import { Pool } from '../types'

export interface Route {
  pools: string[] //addresses of the pools
  percentage: number
}

export interface Quote {
  routes: Route[]
  amountOut: bigint
}

type DpInfo = {
  amountOut: bigint
  path: string[]
}

const max_hops = 4

function multiHopSwap(amountIn: bigint, tokenIn: string, tokenOut: string, graph: Map<string, Pool[]>): string[] {
  // dp[hop][token]
  const dp: Map<number, Map<string, DpInfo>> = new Map<number, Map<string, DpInfo>>()
  dp.set(0, new Map<string, DpInfo>())
  dp.get(0)?.set(tokenIn, { amountOut: amountIn, path: [tokenIn] })

  const res: DpInfo = { amountOut: BigInt(-1), path: [] }

  for (let hop = 0; hop < max_hops - 1; hop++) {
    dp.get(hop)?.forEach((tokenPathInfo, tokenA) => {
      graph.get(tokenA)?.forEach((pool) => {
        const tokenB: string = pool.tokens[0].address == tokenA ? pool.tokens[1].address : pool.tokens[0].address
        if (tokenPathInfo.path.includes(tokenB)) {
          return
        }

        const amountOut = pool.calculateExpectedOutputAmount(tokenA, tokenB, tokenPathInfo.amountOut)
        const newPath = [...tokenPathInfo.path, tokenB]

        if (!dp.has(hop + 1)) {
          dp.set(hop + 1, new Map<string, DpInfo>())
        }

        const dpEntry = dp.get(hop + 1)

        if (!dpEntry?.has(tokenB)) {
          dp.get(hop + 1)?.set(tokenB, { amountOut: amountOut, path: newPath })
        } else if (amountOut > (dpEntry?.get(tokenB)?.amountOut || 0)) {
          dp.get(hop + 1)?.set(tokenB, { amountOut: amountOut, path: newPath })
        }
      })
    })

    if (dp.get(hop + 1)?.has(tokenOut) && (dp.get(hop + 1)?.get(tokenOut)?.amountOut || -1) > res.amountOut) {
      res.amountOut = dp.get(hop + 1)?.get(tokenOut)?.amountOut || BigInt(0)
      res.path = dp.get(hop + 1)?.get(tokenOut)?.path || []
    }
  }

  return res.path
}

// function noEntryOrBetterAvailable(dp: Map<number, Map<string, DpInfo>>, amountOut: bigint): boolean {
//   !dp.get(hop + 1)?.has(tokenB)
// }

function createGraph(pools: Pool[]): Map<string, Pool[]> {
  const graph: Map<string, Pool[]> = new Map<string, Pool[]>()
  for (let pool of pools) {
    const poolId = pool.poolId

    if (!graph.has(pool.tokens[0].address)) {
      graph.set(pool.tokens[0].address, [])
    }

    if (!graph.has(pool.tokens[1].address)) {
      graph.set(pool.tokens[1].address, [])
    }

    graph.get(pool.tokens[0].address)?.push(pool)
    graph.get(pool.tokens[1].address)?.push(pool)
  }

  return graph
}

export { multiHopSwap, createGraph }
