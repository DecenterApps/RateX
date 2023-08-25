import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import {dexIds} from '../dexIdsList'
import { Pool, PoolInfo } from '../../types'
import { UniswapState } from '../pools/uniswap/uniswapState'
import { UniswapV3Pool } from '../pools/uniswap/UniswapV3'

export default class UniswapV3 implements DEXGraphFunctionality {
  endpoint = 'https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum'
  dexId = dexIds.UNISWAP_V3

  static initialize(): DEXGraphFunctionality {
    return new UniswapV3()
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.liquidityPools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(tokenA, tokenB, numPools))
    queryResult.liquidityPools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.liquidityPools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })
    return poolsInfo
  }

  async getPoolsData(poolInfos: PoolInfo[]): Promise<Pool[]> {
    const pools = poolInfos.map((poolInfo: PoolInfo) => poolInfo.poolId)
    console.log("Start initialization");
    await UniswapState.initializeFreshPoolsData(pools)
    console.log("End initialization");
    return poolInfos.map((poolInfo: PoolInfo) => new UniswapV3Pool(poolInfo.poolId, this.dexId, poolInfo.tokens))
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
          decimals
        }
      }
    }
  `)
}

function queryPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
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
        decimals
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
        decimals
      }
    }
  }`)
}

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
