import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { dexIds, balancerWeightedPoolTypes } from '../dexIdsList'
import { Pool, PoolInfo } from '../../types'
import { BalancerState } from '../pools/Balancer/BalancerState'
import { myLocalStorage } from '../../swap/my_local_storage'
import Web3 from 'web3'

export default class BalancerV2 implements DEXGraphFunctionality {
  endpoint = ``
  dexId = dexIds.BALANCER_V2
  chainId = 1
  myLocalStorage = null

  static initialize(myLocalStorage: any): DEXGraphFunctionality {
    const object = new BalancerV2();
    object.myLocalStorage = myLocalStorage;
    return object
  }

  setEndpoint(chainId: number, graphApiKey: string): void {
    if (chainId == 1) {
      this.endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${graphApiKey}/subgraphs/id/C4ayEZP2yTXRAB8vSaTrgN4m9anTe9Mdm2ViyiAuV9TV`
    }
    if (chainId == 42161) {
      this.endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${graphApiKey}/subgraphs/id/itkjv6Vdh22HtNEPQuk5c9M3T7VeGLQtXxcH8rFi1vc`
    }
    this.chainId = chainId
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.pools.forEach((pool: any) => {
      try {
        poolsInfo.push(createPoolFromGraph(pool, this.dexId))
      } catch (e) { }
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(tokenA, tokenB, numPools))
    queryResult.pools.forEach((pool: any) => {
      try {
        poolsInfo.push(createPoolFromGraph(pool, this.dexId))
      } catch (e) { }
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.pools.forEach((pool: any) => {
      try {
        poolsInfo.push(createPoolFromGraph(pool, this.dexId))
      } catch (e) { }
    })

    return poolsInfo
  }

  async getAdditionalPoolDataFromSolidity(poolInfos: PoolInfo[], rpcProvider: Web3): Promise<Pool[]> {
    const pools: Pool[] = await BalancerState.getPoolDataFromContract(poolInfos, this.chainId, rpcProvider)
    for (const pool of pools)
      // @ts-ignore
      this.myLocalStorage.setItem(pool.poolId.toLowerCase(), pool)
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
  const isWeighted = balancerWeightedPoolTypes.includes(jsonData.poolType)
  if (!isWeighted) throw new Error('BALANCER: Pool type not supported')
  const pool: PoolInfo = {
    poolId: jsonData.id,
    dexId: dexId,
    tokens: jsonData.tokens.map((token: any) => {
      return {
        _address: token.id,
        decimals: token.decimals,
        name: token.name,
      }
    }),
  }
  return pool
}
