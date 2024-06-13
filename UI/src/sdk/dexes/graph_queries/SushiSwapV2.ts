import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { dexIds } from '../dexIdsList'
import { Pool, PoolInfo, Token } from '../../types'
import { SushiSwapHelperContract } from '../../../contracts/rateX/SushiSwapHelper'
import { SushiSwapV2Pool } from '../pools/SushiSwapV2'

export default class SushiSwapV2 implements DEXGraphFunctionality {
  endpoint = 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange'
  dexId = dexIds.SUSHI_V2

  static initialize(): DEXGraphFunctionality {
    return new SushiSwapV2()
  }

  setEndpoint(chainId: number): void {
    if (chainId == 42161) {
      this.endpoint = 'https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange'
    }
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

  async getAdditionalPoolDataFromSolidity(poolInfos: PoolInfo[]): Promise<Pool[]> {
    //@ts-ignore
    const rawData: any[][] = await SushiSwapHelperContract.methods.getPoolsData(poolInfos).call()

    const pools: Pool[] = []
    for (let pool of rawData) {
      const poolId = pool[0]
      const dexId = pool[1]
      const tokensRaw1 = pool[2][0]
      const tokensRaw2 = pool[2][1]

      const token1: Token = {
        _address: tokensRaw1[0],
        decimals: Number(tokensRaw1[1]),
        name: tokensRaw1[2],
      }

      const token2: Token = {
        _address: tokensRaw2[0],
        decimals: Number(tokensRaw2[1]),
        name: tokensRaw2[2],
      }

      pools.push(new SushiSwapV2Pool(pool[0], pool[1], [token1, token2], pool[3]))
    }

    return pools
  }
}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
    pairs (first: ${numPools}, orderBy: reserveUSD, orderDirection: desc, where: {volumeUSD_not: "0"}) {
      id
      volumeUSD
      token0 {
        id
        decimals
        name
      }
      token1 {
        id
        decimals
        name
      }
    }
  }`)
}

function queryPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
        pairs(first: ${numPools}, orderBy: reserveUSD, orderDirection: desc, where: {
          or: [
            {and: [
              { token0: "${tokenA.toLowerCase()}" },
              { token1: "${tokenB.toLowerCase()}" },
              { volumeUSD_not: "0" }
              ]},
            {
              and: [
              { token0: "${tokenB.toLowerCase()}" },
              { token1: "${tokenA.toLowerCase()}" },
              { volumeUSD_not: "0" }
              ]
            }
          ]
        }
        ) {
          id
          volumeUSD
          token0 {
            id
            decimals
            name
          }
          token1 {
            id
            decimals
            name
          }
        }
  }`)
}

function queryPoolsWithToken(token: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
        pairs(first: ${numPools}, orderBy: reserveUSD, orderDirection: desc, where: {
          and: [
            {or: [
              { token0: "${token.toLowerCase()}" },
              { token1: "${token.toLowerCase()}" }
            ]},
            { volumeUSD_not: "0" }
          ] 
        }
        ) {
          id
          volumeUSD
          token0 {
            id
            decimals
            name
          }
          token1 {
            id
            decimals
            name
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
