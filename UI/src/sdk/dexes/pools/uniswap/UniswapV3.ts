import { Pool, Token } from '../../../types'
import { UniswapState } from './uniswapState'
import { PoolData } from './types'

export class UniswapV3Pool extends Pool {
  public constructor(poolId: string, dexId: string, tokens: Token[]) {
    super(poolId.toLowerCase(), dexId, tokens)
  }

  calculateExpectedOutputAmount(tokenIn: string, tokenOut: string, amountIn: bigint): bigint {
    const poolData: PoolData | undefined = UniswapState.getPoolDataSync(this.poolId)
    if (!poolData) {
      console.log('ERROR: Data for uni v3 pool: ' + this.poolId + ' not found')
      return BigInt(0)
    }

    return UniswapState.quoter.quote(poolData, tokenIn, tokenOut, amountIn)[0]
  }

  update(tokenIn: string, tokenOut: string, amountIn: bigint) {
    // TODO for Rajko
  }
}
