import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { Pool, PoolInfo, Token } from '../../types'
import { CreateCurveHelperContract } from '../../../contracts/rateX/CurveHelper'
import { CurvePool } from '../pools/Curve'
import BigNumber from 'bignumber.js'
import { dexIds } from '../dexIdsList'

// For curve we use the official API instead of a graph query
export default class Curve implements DEXGraphFunctionality {
  mainPoolsEndpoint = 'https://api.curve.fi/api/getPools/ethereum/main'
  dexId = dexIds.CURVE
  chainId = 1

  static initialize(): DEXGraphFunctionality {
    return new Curve()
  }

  setEndpoint(chainId: number): void {
    if (chainId == 42161) {
      this.mainPoolsEndpoint = 'https://api.curve.fi/api/getPools/arbitrum/main'
    }
    this.chainId = chainId
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const response = await fetch(this.mainPoolsEndpoint, {
      method: 'GET',
    })

    const poolData = (await response.json()).data.poolData

    const poolsInfo: PoolInfo[] = []
    poolData.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
    return []
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    return []
  }

  // calls to Solidity for additional data
  async getAdditionalPoolDataFromSolidity(poolInfos: PoolInfo[]): Promise<Pool[]> {
    //@ts-ignore
    const CurveHelperContract = CreateCurveHelperContract(this.chainId)
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

    return pools
  }
}

// Function to create a CurvePool object from a JSON object
function createPoolFromGraph(jsonData: any, dexId: string): PoolInfo {
  const pool: PoolInfo = {
    poolId: jsonData.address,
    dexId: dexId,
    tokens: jsonData.coins.map((coin: any, index: any) => {
      return {
        _address: coin.address,
        decimals: coin.decimals,
        name: coin.symbol,
      }
    }),
  }
  return pool
}
