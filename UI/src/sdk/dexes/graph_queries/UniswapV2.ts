import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { dexIds } from '../dexIdsList'
import { Pool, PoolInfo, Token } from '../../types'
import { UniswapV2Pool } from '../pools/UniswapV2'
import Web3 from 'web3'
import { CreateUniswapV2HelperContract } from '../../contracts/rateX/UniswapV2Helper'

export default class UniswapV2 implements DEXGraphFunctionality {
  endpoint = ``
  dexId = dexIds.UNI_V2
  chainId = 1
  myLocalStorage = null

  static initialize(myLocalStorage: any): DEXGraphFunctionality {
    const object = new UniswapV2();
    object.myLocalStorage = myLocalStorage;
    return object
  }
  // @reminder add uniswapv2 real endpoint for arbitrum
  setEndpoint(chainId: number, graphApiKey: string): void {
    if (chainId == 1) {
      this.endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${graphApiKey}/subgraphs/id/EYCKATKGBKLWvSfwvBjzfCBmGwYNdVkduYXVivCsLRFu`
    }
    if (chainId == 42161) {
      this.endpoint = `https://gateway-arbitrum.network.thegraph.com/api/${graphApiKey}/subgraphs/id/CStW6CSQbHoXsgKuVCrk3uShGA4JX3CAzzv2x9zaGf8w`
    }
    this.chainId = chainId
  }

  async getTopPools(numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryTopPools(numPools, this.chainId))

    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId, this.chainId))
    })

    return poolsInfo
  }

  async getPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(tokenA, tokenB, numPools, this.chainId))

    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId, this.chainId))
    })

    return poolsInfo
  }

  async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
    const poolsInfo: PoolInfo[] = []
    const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools, this.chainId))

    queryResult.pairs.forEach((pool: any) => {
      poolsInfo.push(createPoolFromGraph(pool, this.dexId, this.chainId))
    })

    return poolsInfo
  }

  async getAdditionalPoolDataFromSolidity(poolInfos: PoolInfo[], rpcProvider: Web3): Promise<Pool[]> {
    //@ts-ignore
    const UniswapV2HelperContract = CreateUniswapV2HelperContract(this.chainId, rpcProvider)
    const rawData: any[][] = await UniswapV2HelperContract.methods.getPoolsData(poolInfos).call()

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

      pools.push(new UniswapV2Pool(pool[0], pool[1], [token1, token2], pool[3]))
    }
    for (const pool of pools)
      // @ts-ignore
      this.myLocalStorage.setItem(pool.poolId.toLowerCase(), pool)
    return pools
  }
}

function queryTopPools(numPools: number, chainId: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
    {
      pairs(first: ${numPools}, orderDirection: desc, orderBy: volumeUSD) {
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

function queryPoolsWithTokenPair(
  tokenA: string,
  tokenB: string,
  numPools: number,
  chainId: number
): TypedDocumentNode<any, Record<string, unknown>> {
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

function queryPoolsWithToken(token: string, numPools: number, chainId: number): TypedDocumentNode<any, Record<string, unknown>> {
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

function createPoolFromGraph(jsonData: any, dexId: string, chainId: number): PoolInfo {
  let pool: PoolInfo

  pool = {
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
