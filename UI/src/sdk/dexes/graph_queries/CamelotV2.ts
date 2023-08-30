import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { Pool, PoolInfo } from '../../types'
import { CamelotDex } from '../../../contracts/rateX/CurveHelper'
import dexIds from '../dexIdsList'

// Camelot is a silly place
// Test queries on https://thegraph.com/hosted-service/subgraph/messari/camelot-v2-arbitrum

export default class CamelotV2 implements DEXGraphFunctionality {
    
  endpoint = 'https://api.thegraph.com/subgraphs/name/messari/camelot-v2-arbitrum'
  dexId = dexIds.CAMELOT_V2

  static initialize(): DEXGraphFunctionality {
    return new CamelotV2()
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.liquidityPools.forEach((lp: any) => {
      poolsInfo.push(createPoolFromGraph(lp, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(token1, token2, first))
    queryResult.liquidityPools.forEach((lp: any) => {
      poolsInfo.push(createPoolFromGraph(lp, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.liquidityPools.forEach((lp: any) => {
      poolsInfo.push(createPoolFromGraph(lp, this.dexId))
    })

    return poolsInfo
  }

  // call to Solidity for additional data
  async getPoolsData(poolInfos: PoolInfo[]): Promise<Pool[]> {

    const rawData: any[][] = await CurveHelperContract.methods.getPoolsData(poolInfos).call()
    return []
  }
}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
    liquidityPools(first: ${numPools}, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      inputTokens {
        id
        decimals
      }
    }
  }`)
}

function queryPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
    liquidityPools(first: ${numPools}, orderBy: totalValueLockedUSD, orderDirection: desc, 
          where: {
        and: [
          {inputTokens_: {id: "${tokenA.toLowerCase()}"}},
          {inputTokens_: {id: "${tokenB.toLowerCase()}"}}
        ]
      }) {
      id
      inputTokens {
        id
        decimals
      }
    }
  }`)
}

function queryPoolsWithToken(token: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`{
    liquidityPools(first: ${numPools}, orderBy: totalValueLockedUSD, orderDirection: desc, 
          where: { inputTokens_: { id: "${token.toLowerCase()}" } }) {
      id
      inputTokens {
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
        _address: jsonData.inputTokens[0].id,
        decimals: jsonData.inputTokens[0].decimals,
      },
      {
        _address: jsonData.inputTokens[1].id,
        decimals: jsonData.inputTokens[1].decimals,
      },
    ],
  }
  return pool
}
