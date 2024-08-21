export interface ResponseType {
  isSuccess: boolean
  txHash: string
  errorMessage: string
}

export type SwapStep = {
  poolId: string
  dexId: string
  tokenIn: string
  tokenOut: string
}

export type Route = {
  swaps: SwapStep[]
  amountIn: bigint
  percentage: number
  quote: bigint
}

export type Quote = {
  routes: Route[]
  quote: bigint
}
