import { getPoolIdsForTokenPairs } from '../quoter/graph_communication'
import { AdditionalPoolInfo, getAdditionalPoolInfo } from '../quoter/solidity_communication'
import { PoolInfo } from '../types'

export interface Route {
  pools: string[] //addresses of the pools
  percentage: number
}

// Will be json
export interface Quote {
  routes: Route[]
  amountOut: bigint
}

async function directSwap(amountIn: bigint, tokenA: string, tokenB: string): Promise<Quote> {
  const poolIds: PoolInfo[] = await getPoolIdsForTokenPairs(tokenA, tokenB)
  const pools: AdditionalPoolInfo[] = await getAdditionalPoolInfo(poolIds)

  let bestOutputAmount: bigint = BigInt(0)
  let bestPool: string = ''

  for (const pool of pools) {
    const expectedOut = calculateExpectedOutputAmountPool(pool, amountIn)
    if (expectedOut > bestOutputAmount) {
      bestPool = pool.poolId
      bestOutputAmount = expectedOut
    }
  }

  const quote: Quote = {
    routes: [
      {
        pools: [bestPool],
        percentage: 100,
      },
    ],
    amountOut: bestOutputAmount,
  }

  return quote
}

function calculateExpectedOutputAmountPool(pool: AdditionalPoolInfo, amountIn: bigint): bigint {
  const k = pool.reserveA * pool.reserveB
  const amount2 = pool.reserveB - k / (pool.reserveA + amountIn)
  const price = amount2 * BigInt(1 - pool.fee)
  return price
}

export { directSwap }
