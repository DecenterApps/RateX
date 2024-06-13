import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { Pool, PoolInfo, Token } from '../../types'
import { CamelotHelperContract } from '../../../contracts/rateX/CamelotHelper'
import { dexIds } from '../dexIdsList'
import { CamelotPool } from '../pools/Camelot'

// Camelot is a silly place
// Test queries on https://thegraph.com/hosted-service/subgraph/messari/camelot-v2-arbitrum

export default class CamelotV2 implements DEXGraphFunctionality {
  // Camelot is currently not working, ne
  endpoint = 'https://api.thegraph.com/subgraphs/name/messari/camelot-v2-arbitrum'
  dexId = dexIds.CAMELOT

  static initialize(): DEXGraphFunctionality {
    return new CamelotV2()
  }

  setEndpoint(chainId: number): void {
    if (chainId == 42161) {
      this.endpoint = 'https://api.thegraph.com/subgraphs/name/messari/camelot-v2-arbitrum'
    }
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
  async getAdditionalPoolDataFromSolidity(poolInfos: PoolInfo[]): Promise<Pool[]> {
    //@ts-ignore
    const rawData: any[][] = await CamelotHelperContract.methods.getPoolsData(poolInfos).call()

    const pools: Pool[] = []
    for (let pool of rawData) {
      const poolId = pool[0]
      const dexId = pool[1]
      const tokensRaw1 = pool[2][0]
      const tokensRaw2 = pool[2][1]

      const token1: Token = {
        _address: tokensRaw1[0],
        decimals: Number(tokensRaw1[1]),
      }

      const token2: Token = {
        _address: tokensRaw2[0],
        decimals: Number(tokensRaw2[1]),
      }

      const reserves = [BigInt(pool[3][0]), BigInt(pool[3][1])]
      const fees = [BigInt(pool[4][0]), BigInt(pool[4][1])]
      const stableSwap = pool[5]

      // do not include pools with no liquidity
      if (reserves[0] === BigInt(0) || reserves[1] === BigInt(0)) {
        continue
      }

      pools.push(new CamelotPool(poolId, dexId, [token1, token2], reserves, fees, stableSwap))
    }

    return pools
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
