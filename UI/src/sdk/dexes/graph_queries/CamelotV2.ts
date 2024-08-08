import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { Pool, PoolInfo, Token } from '../../types'
import { dexIds } from '../dexIdsList'
import { CamelotPool } from '../pools/Camelot'
import { CreateCamelotHelperContract } from '../../contracts/rateX/CamelotHelper'
import Web3 from 'web3'

// Camelot is a silly place

export default class CamelotV2 implements DEXGraphFunctionality {
  // Camelot is currently not working, ne
  endpoint = ``
  dexId = dexIds.CAMELOT
  chainId = 1
  myLocalStorage = null

  static initialize(myLocalStorage: any): DEXGraphFunctionality {
    const object = new CamelotV2();
    object.myLocalStorage = myLocalStorage;
    return object
  }

  setEndpoint(chainId: number, graphApiKey: string): void {
    if (chainId == 1) {
      this.endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${graphApiKey}/subgraphs/id/8zagLSufxk5cVhzkzai3tyABwJh53zxn9tmUYJcJxijG`
    }
    if (chainId == 42161) {
      this.endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${graphApiKey}/subgraphs/id/8zagLSufxk5cVhzkzai3tyABwJh53zxn9tmUYJcJxijG`
    }
    this.chainId = chainId
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools))
    queryResult.pairs.forEach((lp: any) => {
      poolsInfo.push(createPoolFromGraph(lp, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(token1, token2, first))
    queryResult.pairs.forEach((lp: any) => {
      poolsInfo.push(createPoolFromGraph(lp, this.dexId))
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
    queryResult.pairs.forEach((lp: any) => {
      poolsInfo.push(createPoolFromGraph(lp, this.dexId))
    })

    return poolsInfo
  }

  // call to Solidity for additional data
  async getAdditionalPoolDataFromSolidity(poolInfos: PoolInfo[], rpcProvider: Web3): Promise<Pool[]> {
    const CamelotHelperContract = CreateCamelotHelperContract(this.chainId, rpcProvider)
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
    for (const pool of pools)
      // @ts-ignore
      this.myLocalStorage.setItem(pool.poolId.toLowerCase(), pool)
    return pools
  }
}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
      {
        pairs(first: ${numPools}, orderDirection: desc, orderBy: volumeUSD) {
          id
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
        pairs(first: ${numPools}, orderDirection: desc, orderBy: volumeUSD, where: {
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
      pairs(first: ${numPools}, orderDirection: desc, orderBy: volumeUSD, where: {
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
