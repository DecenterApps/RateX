// Define the type for poolIds - returned by the Graph API
// In future will have chainId
export type PoolInfo = {
  poolId: string
  dexId: string
  tokenA: string // address
  tokenB: string // address
}

export interface DEXGraphFunctionality {
  getTopPools: (numPools: number) => Promise<PoolInfo[]>
  getPoolsWithTokenPair: (token1: string, token2: string, first: number) => Promise<PoolInfo[]>
  getPoolsWithToken: (token: string, first: number) => Promise<PoolInfo[]>
}
