import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { dexIds } from '../dexIdsList'
import { Pool, PoolInfo } from '../../types'
import { UniswapState } from '../pools/uniswap/uniswapState'
import { UniswapV3Pool } from '../pools/uniswap/UniswapV3'

const GRAPH_API_KEY = process.env.REACT_APP_GRAPH_API_KEY

export default class UniswapV3 implements DEXGraphFunctionality {
  endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`
  chainId = 1
  dexId = dexIds.UNI_V3

  static initialize(): DEXGraphFunctionality {
    return new UniswapV3()
  }

  setEndpoint(chainId: number): void {
    if (chainId == 42161) {
      this.endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM`
    }
    this.chainId = chainId
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.pools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(tokenA, tokenB, numPools))
    queryResult.pools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.pools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId))
    })
    return poolsInfo
  }

  async getAdditionalPoolDataFromSolidity(poolInfos: PoolInfo[]): Promise<Pool[]> {
    const pools = poolInfos.map((poolInfo: PoolInfo) => poolInfo.poolId)
    console.log('Start initialization')
    await UniswapState.initializeFreshPoolsData(pools, this.chainId)
    console.log('End initialization')
    return poolInfos.map((poolInfo: PoolInfo) => new UniswapV3Pool(poolInfo.poolId, this.dexId, poolInfo.tokens))
  }
}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
    {
      pools(first: ${numPools}, orderDirection: desc, orderBy: volumeUSD) {
        id
        volumeUSD
        token0 {
          id
          name
          decimals
        }
        token1 {
          id
          name
          decimals
        }
      }
    }
  `)
}

function queryPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
    {
      pools(first: ${numPools}, orderDirection: desc, orderBy: volumeUSD, where: {
        or: [
          {and: [
            {token0_: {id: "${tokenA.toLowerCase()}"}},
            {token1_: {id: "${tokenB.toLowerCase()}"}}
          ]},
          {and: [
            {token0_: {id: "${tokenB.toLowerCase()}"}},
            {token1_: {id: "${tokenA.toLowerCase()}"}}
          ]}
        ]   
      }) {
        id
        volumeUSD
        token0 {
          id
          name
          decimals
        }
        token1 {
          id
          name
          decimals
        }
      }
    }
  `)
}

function queryPoolsWithToken(token: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
  {
    pools(first: ${numPools}, orderDirection: desc, orderBy: volumeUSD, where: {
      or: [
        {token0_: {id: "${token.toLowerCase()}"}},
        {token1_: {id: "${token.toLowerCase()}"}}
      ]
    }) {
      id
      volumeUSD
      token0 {
        id
        name
        decimals
      }
      token1 {
        id
        name
        decimals
      }
    }
  }  
`)
}

function createPoolFromGraph(jsonData: any, dexId: string): PoolInfo {
  const pool: PoolInfo = {
    poolId: jsonData.id,
    dexId: dexId,
    tokens: [
      {
        _address: jsonData.token0.id,
        decimals: jsonData.token0.decimals,
        name: jsonData.token0.name,
      },
      {
        _address: jsonData.token1.id,
        decimals: jsonData.token1.decimals,
        name: jsonData.token1.name,
      },
    ],
  }
  return pool
}
