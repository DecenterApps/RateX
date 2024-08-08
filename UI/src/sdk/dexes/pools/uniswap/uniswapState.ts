import { PoolData, PoolState } from './types'
import { convertInitialPoolDataToPoolState, convertRowPoolData } from './utils'
import { UniswapOffchainQuoter } from './uniswapOffchainQuoter'
import { CreateUniswapHelperContract } from '../../../contracts/rateX/UniswapHelper'
import Web3 from 'web3'

export class UniswapState {
  private static poolStateMap: Map<string, PoolState> = new Map<string, PoolState>()
  private static startingPoolStateMap: Map<string, PoolState> = new Map<string, PoolState>()
  public static quoter: UniswapOffchainQuoter = new UniswapOffchainQuoter()
  private static batch_size = 3

  private constructor() { }

  public static getPoolState(poolAddress: string): PoolState | undefined {
    return this.poolStateMap.get(poolAddress.toLowerCase())
  }
  public static resetPoolState(poolAddress: string): void {
    const poolState = this.startingPoolStateMap.get(poolAddress.toLowerCase())
    if (poolState) {
      this.poolStateMap.set(poolAddress.toLowerCase(), poolState)
    }
  }

  private static async getPoolsDataFromContract(pools: string[], chainId: number, rpcProvider: Web3): Promise<PoolData[]> {
    //@ts-ignore
    try {
      const UniswapHelperContract = CreateUniswapHelperContract(chainId, rpcProvider)
      const rawPoolsData: any[] = await UniswapHelperContract.methods.fetchData(pools, 15).call()
      return rawPoolsData.map((rawPoolData: any) => convertRowPoolData(rawPoolData))
    } catch (err) {
      console.log('Error while fetching additional data from the smart contracts: ', err)
      throw err
    }
  }

  public static async initializeFreshPoolsData(pools: string[], chainId: number, rpcProvider: Web3) {
    const poolsSize = pools.length
    const numberOfBatches = Math.ceil(poolsSize / this.batch_size)

    const promises: Promise<PoolData[]>[] = []

    for (let i = 0; i < numberOfBatches; i++) {
      const batch = pools.slice(i * this.batch_size, (i + 1) * this.batch_size)
      promises.push(this.getPoolsDataFromContract(batch, chainId, rpcProvider))
    }
    const allPoolsData = await Promise.all(promises)

    allPoolsData.flat().forEach((poolData: PoolData) => {
      let poolState = convertInitialPoolDataToPoolState(poolData)
      // we will store keys as lowercase addresses
      this.poolStateMap.set(poolData.info.pool.toLowerCase(), poolState)
      this.startingPoolStateMap.set(poolData.info.pool.toLowerCase(), poolState.clone())
    })
  }
}
