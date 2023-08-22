import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import dexIds from '../dexIdsList'
import { PoolInfo } from '../../types'

export default class SushiSwapV2 implements DEXGraphFunctionality {

  endpoint = 'https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange'
  dexId = dexIds.SUSHISWAP_V2

  static initialize(): DEXGraphFunctionality {
    return new SushiSwapV2()
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
  return parse(gql`{
    pairs (first: ${numPools}, orderBy: volumeUSD, orderDirection: desc) {
      id
      token0 {
        id
        decimals
      }
      token1 {
        id
        decimals
      }
    }
  }`)
}

function queryPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
        pairs(first: ${numPools}, orderBy: volumeUSD, where: {
          or: [
            {and: [
              { token0: "${tokenA.toLowerCase()}" },
              { token1: "${tokenB.toLowerCase()}" }
              ]},
            {
              and: [
              { token0: "${tokenB.toLowerCase()}" },
              { token1: "${tokenA.toLowerCase()}" }
              ]
            }
          ]
        }
        ) {
          id
          token0 {
            id
            decimals
          }
          token1 {
            id
            decimals
          }
        }
  }`)
}

function queryPoolsWithToken(token: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
        pairs(first: ${numPools}, orderBy: volumeUSD, where: {
          or: [
            { token0: "${token.toLowerCase()}" },
            { token1: "${token.toLowerCase()}" }
          ]
        }
        ) {
          id
          token0 {
            id
            decimals
          }
          token1 {
            id
            decimals
          }
        }
  }`)
}

function createPoolFromGraph(jsonData: any, dexId: string): PoolInfo {

  // always has 2 tokens in pool
  const pool: PoolInfo = {
    poolId: jsonData.id,
    dexId: dexId,
    tokens: [
      {
        address: jsonData.token0.id,
        decimals: jsonData.token0.decimals
      },
      {
        address: jsonData.token1.id,
        decimals: jsonData.token1.decimals
      }
    ]
  }
  return pool
}
