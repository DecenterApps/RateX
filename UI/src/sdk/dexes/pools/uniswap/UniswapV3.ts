import { Pool, Token } from '../../../types'
import { UniswapState } from './uniswapState'
import { PoolState } from './types'

export class UniswapV3Pool extends Pool {
  public constructor(poolId: string, dexId: string, tokens: Token[]) {
    super(poolId.toLowerCase(), dexId, tokens)
  }

  calculateExpectedOutputAmount(tokenIn: string, tokenOut: string, amountIn: bigint): bigint {
    const poolData: PoolState | undefined = UniswapState.getPoolState(this.poolId)
    if (!poolData) {
      console.log('ERROR: Data for uni v3 pool: ' + this.poolId + ' not found')
      return BigInt(0)
    }

    return UniswapState.quoter.quote(poolData, tokenIn, tokenOut, amountIn)[0]
  }

  reset(): void {
    UniswapState.resetPoolState(this.poolId)
  }

  update(tokenIn: string, tokenOut: string, amountIn: bigint) {
    const poolData: PoolState | undefined = UniswapState.getPoolState(this.poolId)
    if (!poolData) {
      console.log('ERROR: Data for uni v3 pool: ' + this.poolId + ' not found')
      return BigInt(0)
    }

    // lastQuote will be stored each time we call quote
    const lastQuote = poolData.lastQuote;
    poolData.data.currentLiquidity = lastQuote.newLiquidity;
    poolData.data.currentSqrtPriceX96 = lastQuote.newSqrtPriceX96;
    poolData.data.currentTickIndex = lastQuote.newTickIndex;

    // we don't need this, because we don't use amountIn anyway
    return BigInt(0);
  }
}
