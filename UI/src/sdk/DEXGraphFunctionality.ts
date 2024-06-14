import { Pool, PoolInfo } from './types'

export interface DEXGraphFunctionality {
  setEndpoint: (chainId: number) => void
  getTopPools: (numPools: number) => Promise<PoolInfo[]>
  getPoolsWithTokenPair: (tokenA: string, tokenB: string, first: number) => Promise<PoolInfo[]>
  getPoolsWithToken: (token: string, first: number) => Promise<PoolInfo[]>

  // calls to Solidity for additional data
  getAdditionalPoolDataFromSolidity: (poolInfos: PoolInfo[]) => Promise<Pool[]>
}
