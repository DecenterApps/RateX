import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import {dexIds, balancerStablePoolTypes, balancerWeightedPoolTypes} from '../dexIdsList'
import { Pool, PoolInfo } from '../../types'
import { BalancerState } from '../pools/Balancer/BalancerState'
import { json } from 'stream/consumers'

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
     const pools: Pool[] = await BalancerState.getPoolDataFromContract(poolInfos)

    return pools
  }
}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
    pools(first: ${numPools}, orderDirection: desc, orderBy: totalLiquidity, where: {totalLiquidity_not: "0"}) {
      id
      name
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
              {tokens_: {address_contains: "${tokenA.toLowerCase()}"}},
              {tokens_: {address_contains: "${tokenB.toLowerCase()}"}}
            ],
            totalLiquidity_not: "0"
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
          {
              tokens_: {address_contains: "${token.toLowerCase()}"},
              totalLiquidity_not: "0"
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

function createPoolFromGraph(jsonData: any, dexIdStable: string, dexIdWeighted: string): PoolInfo {
  const isStable = balancerStablePoolTypes.includes(jsonData.poolType)
  const isWeighted = balancerWeightedPoolTypes.includes(jsonData.poolType)

  // console.log(jsonData)
  // always has 2 tokens in pool
  // TO_DO: IMPORTANT POOL TYPE 
  const pool: PoolInfo = {
    poolId: jsonData.id,
    dexId: (isStable ? dexIdStable : (isWeighted ? dexIdWeighted : "NOT_SUPPORTED")),
    tokens: [
      {
        _address: jsonData.tokens[0].id,
        decimals: jsonData.tokens[0].decimals,
        name: jsonData.tokens[0].name
      },
      {
        _address: jsonData.tokens[1].id,
        decimals: jsonData.tokens[1].decimals,
        name: jsonData.tokens[1].name
      }
    ]
  }
  return pool
}
