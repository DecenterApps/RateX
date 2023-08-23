import { Pool, Token } from '../types'

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
    dp.get(hop)?.forEach((tokenPathInfo: DpInfo, tokenA: string) => {
      graph.get(tokenA)?.forEach((pool: Pool) => {
        pool.tokens.forEach((tokenB: Token) => {
          if (tokenPathInfo.path.includes(tokenB._address)) {
            return
          }

          const amountOut = pool.calculateExpectedOutputAmount(tokenA, tokenB._address, tokenPathInfo.amountOut)
          const newPath = [...tokenPathInfo.path, tokenB._address]

          if (!dp.has(hop + 1)) {
            dp.set(hop + 1, new Map<string, DpInfo>())
          }

          const dpEntry = dp.get(hop + 1)

          if (!dpEntry?.has(tokenB._address)) {
            dp.get(hop + 1)?.set(tokenB._address, { amountOut: amountOut, path: newPath })
          } else if (amountOut > (dpEntry?.get(tokenB._address)?.amountOut || 0)) {
            dp.get(hop + 1)?.set(tokenB._address, { amountOut: amountOut, path: newPath })
          }
        })
      })
    })

    if (dp.get(hop + 1)?.has(tokenOut) && (dp.get(hop + 1)?.get(tokenOut)?.amountOut || -1) > res.amountOut) {
      res.amountOut = dp.get(hop + 1)?.get(tokenOut)?.amountOut || BigInt(0)
      res.path = dp.get(hop + 1)?.get(tokenOut)?.path || []
    }
  }
  console.log(dp)
  console.log(res)

  return res.path
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
