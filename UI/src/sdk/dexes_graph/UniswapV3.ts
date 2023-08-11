import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality, PoolInfo } from '../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'

export default class UniswapV3 implements DEXGraphFunctionality {
  endpoint = 'https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum'
  dexId = 'UNI_V3'

  static initialize(): DEXGraphFunctionality {
    return new UniswapV3()
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.liquidityPools.forEach((pool: any) => {
      poolsInfo.push({
        poolId: pool.id,
        dexId: this.dexId,
        tokenA: pool.inputTokens[0].id,
        tokenB: pool.inputTokens[1].id,
      })
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(tokenA, tokenB, numPools))
    queryResult.liquidityPools.forEach((pool: any) => {
      poolsInfo.push({
        poolId: pool.id,
        dexId: this.dexId,
        tokenA: pool.inputTokens[0].id,
        tokenB: pool.inputTokens[1].id,
      })
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.liquidityPools.forEach((pool: any) => {
      poolsInfo.push({
        poolId: pool.id,
        dexId: this.dexId,
        tokenA: pool.inputTokens[0].id,
        tokenB: pool.inputTokens[1].id,
      })
    })

    return poolsInfo
  }
}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
    {
      liquidityPools(first:${numPools}, orderDirection: desc, orderBy: cumulativeVolumeUSD) {
        id
        cumulativeVolumeUSD
        inputTokens {
          id
        }
      }
    }
  `)
}

function queryPoolsWithTokenPair(
  tokenA: string,
  tokenB: string,
  numPools: number
): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
        liquidityPools(first: ${numPools}, orderDirection: desc, orderBy: cumulativeVolumeUSD, where: {
          and: [
            {inputTokens_: {id: "${tokenA.toLowerCase()}"}},
            {inputTokens_: {id: "${tokenB.toLowerCase()}"}}
          ]
        }
        ) {
          id
          cumulativeVolumeUSD
          inputTokens {
            id
          }
        }
      }`)
}

function queryPoolsWithToken(token: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
        liquidityPools(first: ${numPools}, orderDirection: desc, orderBy: cumulativeVolumeUSD, where: {
          inputTokens_: { id: "${token.toLowerCase()}" }
        }
        ) {
          id
          cumulativeVolumeUSD
          inputTokens {
            id
          }
        }
      }`)
}
