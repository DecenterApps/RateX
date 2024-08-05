import { PoolData, PoolState } from './types'
import { convertInitialPoolDataToPoolState, convertRowPoolData } from './utils'
import { UniswapOffchainQuoter } from './uniswapOffchainQuoter'

let CreateUniswapHelperContract: any;

(async () => {
  import('../../../../contracts/rateX/UniswapHelper').then((module) => {
    CreateUniswapHelperContract = module.CreateUniswapHelperContract;
  });
})()

export class UniswapState {
  private static poolStateMap: Map<string, PoolState> = new Map<string, PoolState>()
  public static quoter: UniswapOffchainQuoter = new UniswapOffchainQuoter()
  private static batch_size = 3

  private constructor() {}

  public static getPoolState(poolAddress: string): PoolState | undefined {
    return this.poolStateMap.get(poolAddress.toLowerCase())
  }

  private static async getPoolsDataFromContract(pools: string[], chainId: number): Promise<PoolData[]> {
    //@ts-ignore
    try {
      const UniswapHelperContract = CreateUniswapHelperContract(chainId)
      const rawPoolsData: any[] = await UniswapHelperContract.methods.fetchData(pools, 15).call()
      return rawPoolsData.map((rawPoolData: any) => convertRowPoolData(rawPoolData))
    } catch (err) {
      console.log('Error while fetching additional data from the smart contracts: ', err)
      throw err
    }
  }

  public static async initializeFreshPoolsData(pools: string[], chainId: number) {
    const poolsSize = pools.length
    const numberOfBatches = Math.ceil(poolsSize / this.batch_size)

    const promises: Promise<PoolData[]>[] = []

    for (let i = 0; i < numberOfBatches; i++) {
      const batch = pools.slice(i * this.batch_size, (i + 1) * this.batch_size)
      promises.push(this.getPoolsDataFromContract(batch, chainId))
    }
    const allPoolsData = await Promise.all(promises)

    allPoolsData.flat().forEach((poolData: PoolData) => {
      let poolState = convertInitialPoolDataToPoolState(poolData)
      // we will store keys as lowercase addresses
      this.poolStateMap.set(poolData.info.pool.toLowerCase(), poolState)
    })
  }
}
