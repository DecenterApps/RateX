import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { Pool, PoolInfo, Token } from '../../types'
import { CurvePool } from '../pools/Curve'
import BigNumber from 'bignumber.js'
import { dexIds } from '../dexIdsList'
import CurveMainnetGraph from "./hardcoded/CurveMainnetGraph.json";
import CurveArbitrumGraph from "./hardcoded/CurveArbitrumGraph.json"
import { myLocalStorage } from '../../swap/my_local_storage'
import Web3 from 'web3'
import { CreateCurveHelperContract } from '../../contracts/rateX/CurveHelper'
// For curve we use the official API instead of a graph query
export default class Curve implements DEXGraphFunctionality {
  dexId = dexIds.CURVE
  chainId = 1
  myLocalStorage = null

  static initialize(myLocalStorage: any): DEXGraphFunctionality {
    const object = new Curve();
    object.myLocalStorage = myLocalStorage;
    return object
  }

  setEndpoint(chainId: number): void {
    this.chainId = chainId
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    return ((this.chainId == 1) ? CurveMainnetGraph : CurveArbitrumGraph).map(e => {
      const obj = e;
      const poolInfo: PoolInfo = {
        poolId: obj.poolId,
        dexId: obj.dexId,
        tokens: obj.tokens.map((coin, index: any) => {
          return {
            _address: coin._address,
            decimals: parseInt(coin.decimals),
            name: coin.name,
          }
        }),
      }
      return poolInfo;
    })
  }

  async getPoolsWithTokenPair(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
    return []
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    return []
  }

  // calls to Solidity for additional data
  async getAdditionalPoolDataFromSolidity(poolInfos: PoolInfo[], rpcProvider: Web3): Promise<Pool[]> {
    //@ts-ignore
    const CurveHelperContract = CreateCurveHelperContract(this.chainId, rpcProvider)
    const rawData: any[][] = await CurveHelperContract.methods.getPoolsData(poolInfos).call()

    const pools: Pool[] = []
    for (let pool of rawData) {
      const poolId = pool[0]
      const dexId = pool[1]
      const tokensRaw1 = pool[2][0]
      const tokensRaw2 = pool[2][1]

      const token1: Token = {
        _address: tokensRaw1[0],
        decimals: Number(tokensRaw1[1]),
      }

      const token2: Token = {
        _address: tokensRaw2[0],
        decimals: Number(tokensRaw2[1]),
      }

      let noLiquidity = false
      for (let reserve of pool[3]) {
        if (reserve == BigInt(0)) {
          noLiquidity = true
        }
      }

      if (noLiquidity) {
        continue
      }

      const reserves: BigNumber[] = pool[3].map((reserve: bigint) => new BigNumber(reserve.toString()))

      pools.push(new CurvePool(pool[0], pool[1], [token1, token2], reserves, pool[4], pool[5]))
    }

    for (const pool of pools)
      // @ts-ignore
      this.myLocalStorage.setItem(pool.poolId.toLowerCase(), pool)
    return pools
  }
}
