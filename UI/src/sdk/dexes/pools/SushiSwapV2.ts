import { Token, Pool } from '../../types'

export class SushiSwapV2Pool extends Pool {

  reserves: bigint[]
  static readonly fee: number = 0.003

  protected constructor(poolId: string, dexId: string, tokens: Token[], reserves: bigint[]) {
    super(poolId, dexId, tokens)
    this.reserves = reserves
  }

  calculateExpectedOutputAmount(tokenIn: string, tokenOut: string, amountIn: bigint): bigint {
    const k = this.reserves[0] * this.reserves[1]
    const amount2 =
      tokenIn === this.tokens[0].address ? this.reserves[1] - k / (this.reserves[0] + amountIn) : this.reserves[0] - k / (this.reserves[1] + amountIn)
    return BigInt(Math.round(Number(amount2) * (1 - SushiSwapV2Pool.fee)))
  }
  
}