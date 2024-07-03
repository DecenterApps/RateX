import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { dexIds, balancerWeightedPoolTypes } from '../dexIdsList'
import { Pool, PoolInfo } from '../../types'
import { BalancerState } from '../pools/Balancer/BalancerState'

const GRAPH_API_KEY = process.env.REACT_APP_GRAPH_API_KEY

export default class BalancerV2 implements DEXGraphFunctionality {
  endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/C4ayEZP2yTXRAB8vSaTrgN4m9anTe9Mdm2ViyiAuV9TV`
  dexId = dexIds.BALANCER_V2
  chainId = 1

  static initialize(): DEXGraphFunctionality {
    return new BalancerV2()
  }

  setEndpoint(chainId: number): void {
    if (chainId == 42161) {
      this.endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/itkjv6Vdh22HtNEPQuk5c9M3T7VeGLQtXxcH8rFi1vc`
    }
    this.chainId = chainId
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.pools.forEach((pool: any) => {
      try {
        poolsInfo.push(createPoolFromGraph(pool, this.dexId))
      } catch (e) {}
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(tokenA, tokenB, numPools))
    queryResult.pools.forEach((pool: any) => {
      try {
        poolsInfo.push(createPoolFromGraph(pool, this.dexId))
      } catch (e) {}
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.pools.forEach((pool: any) => {
      try {
        poolsInfo.push(createPoolFromGraph(pool, this.dexId))
      } catch (e) {}
    })

    return poolsInfo
  }

  async getAdditionalPoolDataFromSolidity(poolInfos: PoolInfo[]): Promise<Pool[]> {
    const pools: Pool[] = await BalancerState.getPoolDataFromContract(poolInfos, this.chainId)

    return pools
  }
}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
    pools(first: ${numPools},  orderBy: totalLiquidity, orderDirection: desc, where: {totalLiquidity_not: "0"}) {
      id
      name
      poolType
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
      pools(first: ${numPools}, orderBy: totalLiquidity, orderDirection: desc, where: {
          and: [
              {tokens_: {address: "${tokenA.toLowerCase()}"}},
              {tokens_: {address: "${tokenB.toLowerCase()}"}},
              {totalLiquidity_not: "0"}
            ],
        }
        ) {
          id
          poolType
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
      pools(first: ${numPools}, orderBy: totalLiquidity, orderDirection: desc, where: 
          {
              tokens_: {address_contains: "${token.toLowerCase()}"},
              totalLiquidity_not: "0"
          }
        ) {
          id
          poolType
          tokens {
            id
            decimals
            name
          }
      }
  }
  `)
}

function createPoolFromGraph(jsonData: any, dexId: string): PoolInfo {
  // const isStable = balancerStablePoolTypes.includes(jsonData.poolType)
  const isWeighted = balancerWeightedPoolTypes.includes(jsonData.poolType)
  if (!isWeighted) throw new Error('BALANCER: Pool type not supported')
  if (jsonData.tokens.length > 2) throw new Error('BALANCER: Pool has more then 2 tokens')
  // always has 2 tokens in pool
  // TO_DO: IMPORTANT POOL TYPE
  const pool: PoolInfo = {
    poolId: jsonData.id,
    dexId: dexId,
    tokens: [
      {
        _address: jsonData.tokens[0].id,
        decimals: jsonData.tokens[0].decimals,
        name: jsonData.tokens[0].name,
      },
      {
        _address: jsonData.tokens[1].id,
        decimals: jsonData.tokens[1].decimals,
        name: jsonData.tokens[1].name,
      },
    ],
  }
  return pool
}
