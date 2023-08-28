import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import dexIds from '../dexIdsList'
import { Pool, PoolInfo, Token } from '../../types'
import { CurveHelperContract } from '../../../contracts/CurveHelper'
import { CurvePool } from '../pools/Curve'
import BigNumber from 'bignumber.js'

// test queries on: https://thegraph.com/hosted-service/subgraph/messari/curve-finance-arbitrum
// test preprocessing query on: https://thegraph.com/hosted-service/subgraph/convex-community/volume-arbitrum

export default class Curve implements DEXGraphFunctionality {
  prepocessingEndpoint = 'https://api.thegraph.com/subgraphs/name/convex-community/volume-arbitrum'
  endpoint = 'https://api.thegraph.com/subgraphs/name/messari/curve-finance-arbitrum'
  dexId = dexIds.CURVE

  // we exclude Curve V2 pools (we have not yet implemented the math for it)
  poolsV2: string = ''

  static initialize(): DEXGraphFunctionality {
    return new Curve()
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    this.poolsV2 = await getV2Pools(this.poolsV2, this.prepocessingEndpoint)

    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools, this.poolsV2))
    queryResult.liquidityPools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })
    return poolsInfo
  }

  async getPoolsWithTokenPair(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
    this.poolsV2 = await getV2Pools(this.poolsV2, this.prepocessingEndpoint)

    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(token1, token2, first, this.poolsV2))
    queryResult.liquidityPools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    this.poolsV2 = await getV2Pools(this.poolsV2, this.prepocessingEndpoint)

    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools, this.poolsV2))
    queryResult.liquidityPools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  // calls to Solidity for additional data
  async getPoolsData(poolInfos: PoolInfo[]): Promise<Pool[]> {
    //@ts-ignore
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

/*For now, we are not supporting off-chain outputAmount calculations for Curve V2 pools.
 * So far, there are 2 pools on Arbitrum that we are not supporting.
 * There is no way to filter out V2 Graph pools from V1 pools on Messari Graph API
 * But we can get the V2 pools through the Comvex-community Graph API (has different limitations
 * so we are using a combination of the two)
 */
async function getV2Pools(poolsV2String: string, endpoint: string): Promise<string> {
  if (poolsV2String.length !== 0) return poolsV2String

  let poolsV2: string[] = []
  const fetchedData = await request(endpoint, getV2PoolsQuery())
  fetchedData.pools.forEach((id: any) => {
    poolsV2.push(id)
  })

  poolsV2.forEach((id) => (poolsV2String = poolsV2String.concat('"' + id + '", ')))
  return poolsV2String
}

function getV2PoolsQuery(): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
    {
      pools(orderBy: cumulativeVolumeUSD, orderDirection: desc, where: { isV2: true }) {
        id
      }
    }
  `)
}

function queryTopPools(numPools: number, poolsV2: string): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
  {
    liquidityPools(orderBy: totalValueLockedUSD
      						orderDirection: desc 
      						first: ${numPools}
      						where: {
                    id_not_in: [${poolsV2}]
                  }
      ) {
      id
      inputTokenBalances
      inputTokens {
        id
        decimals
        name
        symbol
      }
    }
  }
  `)
}

function queryPoolsWithTokenPair(
  tokenA: string,
  tokenB: string,
  numPools: number,
  poolsV2: string
): TypedDocumentNode<any, Record<string, unknown>> {
  // query does not need an or because it is assumed that pools will have >= 2 tokens
  return parse(gql`
  {
    liquidityPools(orderBy: totalValueLockedUSD, orderDirection: desc, first: ${numPools},
      where: {
					and: [
								{and: [
					            {inputTokens_: {id: "${tokenA.toLowerCase()}"}},
					            {inputTokens_: {id: "${tokenB.toLowerCase()}"}}
					        	]}, 
								{id_not_in: [${poolsV2}]}
							]
		  }
	    ) {
      id
      inputTokenBalances
      inputTokens {
        id
        decimals
        name
        symbol
      }
    }
  }
  `)
}

function queryPoolsWithToken(token: string, numPools: number, poolsV2: string): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
  {
    liquidityPools(orderBy: totalValueLockedUSD, orderDirection: desc, first: ${numPools},
      where: { and: [
							{id_not_in: [${poolsV2}]},
							{inputTokens_: {id: "${token.toLowerCase()}"}}
      ] }
    ) {
      id
      inputTokenBalances
      inputTokens {
        id
        decimals
        name
        symbol
      }
    }
  }
  `)
}

// Function to create a CurvePool object from a JSON object
function createPoolFromGraph(jsonData: any, dexId: string): PoolInfo {
  const pool: PoolInfo = {
    poolId: jsonData.id,
    dexId: dexId,
    tokens: jsonData.inputTokens.map((token: any, index: any) => {
      return {
        _address: token.id,
        decimals: token.decimals,
      }
    }),
  }
  return pool
}
