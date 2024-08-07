import { Pool, Token } from '../../types'

export class UniswapV2Pool extends Pool {
  reserves: bigint[]
  startingReserves: bigint[]

  constructor(poolId: string, dexId: string, tokens: Token[], reserves: bigint[]) {
    super(poolId, dexId, tokens)
    this.reserves = reserves.slice()
    this.startingReserves = [...this.reserves]
  }

  reset(): void {
    this.reserves = [...this.startingReserves]
}

  calculateExpectedOutputAmount(tokenIn: string, tokenOut: string, amountIn: bigint): bigint {
    let reserveIn: bigint = this.reserves[0]
    let reserveOut: bigint = this.reserves[1]
    if (tokenIn.toLowerCase() === this.tokens[1]._address.toLowerCase()) {
      reserveIn = this.reserves[1]
      reserveOut = this.reserves[0]
    }
    return (amountIn * BigInt(997) * reserveOut) / (reserveIn * BigInt(1000) + amountIn * BigInt(997))
  }

  update(tokenIn: string, tokenOut: string, amountIn: bigint, amountOut: bigint): void {
    if (tokenIn.toLowerCase() === this.tokens[0]._address.toLowerCase()) {
      this.reserves[0] += amountIn
      this.reserves[1] -= amountOut
    } else {
      this.reserves[1] += amountIn
      this.reserves[0] -= amountOut
    }
  }
}
