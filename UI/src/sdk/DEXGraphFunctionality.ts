import { PoolInfo } from './types'

export interface DEXGraphFunctionality {
  getTopPools: (numPools: number) => Promise<PoolInfo[]>
  getPoolsWithTokenPair: (tokenA: string, tokenB: string, first: number) => Promise<PoolInfo[]>
  getPoolsWithToken: (token: string, first: number) => Promise<PoolInfo[]>
}
