import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { Pool, PoolInfo } from '../types'

export class SushiSwapV2Pool extends Pool {
  reserveA: bigint
  reserveB: bigint

  static readonly fee: number = 0.003

  constructor(poolId: string, dexId: string, tokenA: string, tokenB: string, reserveA: bigint, reserveB: bigint) {
    super(poolId, dexId, tokenA, tokenB)
    this.reserveA = reserveA
    this.reserveB = reserveB
  }

  calculateExpectedOutputAmount(tokenIn: string, amountIn: bigint): bigint {
    const k = this.reserveA * this.reserveB
    const amount2 =
      tokenIn === this.tokenA ? this.reserveB - k / (this.reserveA + amountIn) : this.reserveA - k / (this.reserveB + amountIn)
    return BigInt(Math.round(Number(amount2) * (1 - SushiSwapV2Pool.fee)))
  }
}
export default class SushiSwapV2 implements DEXGraphFunctionality {
  endpoint = 'https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange'
  dexId = 'SUSHI_V2'

  static initialize(): DEXGraphFunctionality {
    return new SushiSwapV2()
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push({
        poolId: pool.id,
        dexId: this.dexId,
        tokenA: pool.token0.id,
        tokenB: pool.token1.id,
      })
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(tokenA, tokenB, numPools))
    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push({
        poolId: pool.id,
        dexId: this.dexId,
        tokenA: pool.token0.id,
        tokenB: pool.token1.id,
      })
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push({
        poolId: pool.id,
        dexId: this.dexId,
        tokenA: pool.token0.id,
        tokenB: pool.token1.id,
      })
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
      }
      token1 {
        id
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
          }
          token1 {
            id
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
          }
          token1 {
            id
          }
        }
  }`)
}
