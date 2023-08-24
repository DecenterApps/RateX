export class PoolEntry {
  poolAddress: string
  dexId: string
  constructor(poolAddress: string, dexId: string) {
    this.poolAddress = poolAddress
    this.dexId = dexId
  }
}

export class QuoteResultEntry {
  dexId: string
  poolAddress: string
  reserveA: bigint
  reserveB: bigint
  amountOut: bigint
  constructor(dexId: string, poolAddress: string, reserveA: bigint, reserveB: bigint, amountOut: bigint) {
    this.dexId = dexId
    this.poolAddress = poolAddress
    this.reserveA = reserveA
    this.reserveB = reserveB
    this.amountOut = amountOut
  }
}

export interface ResponseType {
  isSuccess: boolean
  txHash: string
  errorMessage: string
}

export type Token = {
  _address: string
  decimals: number
}

// we get from Graph QL
export type PoolInfo = {
  poolId: string
  dexId: string
  tokens: Token[] // list of addresses
}

// we get from Solidity (extra info)
export abstract class Pool {
  poolId: string
  dexId: string
  tokens: Token[] // list of addresses

  protected constructor(poolId: string, dexId: string, tokens: Token[]) {
    this.poolId = poolId
    this.dexId = dexId
    this.tokens = tokens.map((token) => ({ _address: token._address.toLowerCase(), decimals: token.decimals }))
  }

  abstract calculateExpectedOutputAmount(tokenIn: string, tokenOut: string, amountIn: bigint): bigint
}

export type Swap = {
  poolId: string
  dexId: string
  tokenA: string
  tokenB: string
}

export type Route = {
  swaps: Swap[]
  amountOut: bigint
  percentage: number
}

export type Quote = {
  routes: Route[]
  amountOut: bigint
}
