import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import dexIds from '../dexIdsList'
import { Pool, PoolInfo } from '../../types'

// test queries on: https://thegraph.com/hosted-service/subgraph/messari/curve-finance-arbitrum

export default class Curve implements DEXGraphFunctionality {
  endpoint = 'https://api.thegraph.com/subgraphs/name/messari/curve-finance-arbitrum'
  dexId = dexIds.CURVE

  static initialize(): DEXGraphFunctionality {
    return new Curve()
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(token1, token2, first))
    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsData(poolInfos: PoolInfo[]): Promise<Pool[]> {
    return []
  }
}

/*For now, we are not supporting off-chain outputAmount calculations for Curve V2 pools.
* So far, there are 2 pools on Arbitrum that we are not supporting.
* There is no way to filter out V2 Graph pools from V1 pools, so we are hardcoding those pool ids here. 
*/
function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
  {
    liquidityPools(orderBy: totalValueLockedUSD
      						orderDirection: desc 
      						first: ${numPools}
      						where: {
                    id_not_in: ["0xa827a652ead76c6b0b3d19dba05452e06e25c27", "0x960ea3e3c7fb317332d990873d354e18d7645590"]
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

function queryPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  // query does not need an or because it is assumed that pools will have >= 2 tokens
  return parse(gql`
  {
    liquidityPools(orderBy: totalValueLockedUSD, orderDirection: desc, first: ${numPools},
      where: {
        and: [
            {inputTokens_: {id: "${tokenA.toLowerCase()}"}},
            {inputTokens_: {id: "${tokenB.toLowerCase()}"}}
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

function queryPoolsWithToken(token: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
  {
    liquidityPools(orderBy: totalValueLockedUSD, orderDirection: desc, first: ${numPools},
      where: {inputTokens_: {id: "${token.toLowerCase()}"}}
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
        address: token.id,
        decimals: token.decimals,
      }
    }),
  }
  return pool
}
