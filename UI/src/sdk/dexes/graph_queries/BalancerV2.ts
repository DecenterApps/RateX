import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import {dexIds, balancerWeightedPoolTypes, balancerStablePoolTypes} from '../dexIdsList'
import { Pool, PoolInfo } from '../../types'

const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers")

// test at: https://thegraph.com/hosted-service/subgraph/balancer-labs/balancer-arbitrum-v2

export default class BalancerV2 implements DEXGraphFunctionality {

  endpoint = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-arbitrum-v2'
  dexIdStable = dexIds.BALANCER_V2_STABLE
  dexIdWeighted = dexIds.BALANCER_V2_WEIGHTED

  static initialize(): DEXGraphFunctionality {
    return new BalancerV2()
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.pools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexIdStable, this.dexIdWeighted))
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(tokenA, tokenB, numPools))
    queryResult.pools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexIdStable, this.dexIdWeighted))
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.pools.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexIdStable, this.dexIdWeighted))
    })

    return poolsInfo
  }

  async getPoolsData(poolInfos: PoolInfo[]): Promise<Pool[]> {
    const pools: Pool[] = []

    poolInfos.forEach((poolInfo: PoolInfo) => {
    })
    return pools
  }
}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
    pools(first: ${numPools}, orderDirection: desc, orderBy: totalLiquidity) {
      id
      address
      poolType
      poolTypeVersion
      tokens {
        id
        decimals
        name
      }
    }
  }
  `)
}

function queryPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
      pools(first: ${numPools}, orderBy: totalLiquidity, where: {
          and: [
              {tokens_: {address: "${tokenA.toLowerCase()}"}},
              {tokens_: {address: "${tokenB.toLowerCase()}"}}
            ]
        }
        ) {
          id
          address
          poolType
          poolTypeVersion
          tokens {
            id
            decimals
            name
          }
      }
  }
  `)
}

function queryPoolsWithToken(token: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
      pools(first: ${numPools}, orderBy: totalLiquidity, where: 
          {tokens_: {address: "${token.toLowerCase()}"}}
        ) {
          id
          address
          poolType
          poolTypeVersion
          tokens {
            id
            decimals
            name
          }
      }
  }
  `)
}

function createPoolFromGraph(jsonData: any, dexIdStable: string, dexIdWeighted: string): PoolInfo {
  const isStable = balancerStablePoolTypes.includes(jsonData.poolType)

  // always has 2 tokens in pool
  // TO_DO: IMPORTANT POOL TYPE 
  const pool: PoolInfo = {
    poolId: jsonData.id,
    dexId: (isStable ? dexIdStable : dexIdWeighted),
    tokens: [
      {
        _address: jsonData.tokens[0].id,
        decimals: jsonData.tokens[0].decimals
      },
      {
        _address: jsonData.tokens[1].id,
        decimals: jsonData.tokens[1].decimals
      }
    ]
  }
  return pool
}
