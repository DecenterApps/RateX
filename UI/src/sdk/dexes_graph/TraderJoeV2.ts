import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { PoolInfo } from '../types'

export default class TraderJoeV2 implements DEXGraphFunctionality {
  endpoint = 'https://api.thegraph.com/subgraphs/name/traderjoe-xyz/joe-v2-arbitrum'
  dexId = 'TraderJoeV2'

  static initialize(): DEXGraphFunctionality {
    return new TraderJoeV2()
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(tokenA, tokenB, numPools))
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
}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
    {
      lbpairs(orderBy: volumeUSD, orderDirection: desc, first: ${numPools}){
        id
        tokenX {
          id
          decimals
        }
        tokenY {
          id
          decimals
        }
      }
    }
  `)
}

function queryPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
      lbpairs(first: ${numPools}, orderBy: volumeUSD, orderDirection: desc, where: {
        or: [
          {
            and: [
              { tokenX_: "${tokenA.toLowerCase()}" },
              { tokenY_: "${tokenB.toLowerCase()}" }
            ]
          },
          {
            and: [
              { tokenX_: "${tokenB.toLowerCase()}" },
              { tokenY_: "${tokenA.toLowerCase()}" }
            ]
          }
        ]
      }) {
        id
        tokenX {
          id
          decimals
        }
        tokenY {
          id
          decimals
        }
      }
    }`)
}

function queryPoolsWithToken(token: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
      lbpairs(first: ${numPools}, orderBy: volumeUSD, orderDirection: desc, where: {
        or: [
          { tokenX_: "${token.toLowerCase()}" },
          { tokenY_: "${token.toLowerCase()}" }
        ]
      }) {
        id
        name
        tokenX {
          id
          decimals
        }
        tokenY {
          id
          decimals
        }
      }
    }`)
}

function createPoolFromGraph(jsonData: any, dexId: string): PoolInfo {

  // always has 2 tokens in pool ?
  const pool: PoolInfo = {
    poolId: jsonData.id,
    dexId: dexId,
    tokens: [
      {
        address: jsonData.tokenX.id,
        decimals: jsonData.tokenX.decimals
      },
      {
        address: jsonData.tokenY.id,
        decimals: jsonData.tokenY.decimals
      }
    ]
  }
  return pool
}
