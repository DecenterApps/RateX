import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality, PoolInfo } from '../DEXGraphFunctionality';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

export default class UniswapV3 implements DEXGraphFunctionality {

  endpoint = "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum"

  static initialize(): DEXGraphFunctionality {
    return new UniswapV3()
  }

  async topPools(numPools: number): Promise<PoolInfo[]> {
    
    const poolsInfo: PoolInfo[] = []
    const result = await request(this.endpoint, topPoolsFunction(numPools));
    result.liquidityPools.forEach((pool: any) => {
      poolsInfo.push({
        poolId: pool.id,
        dexId: 'UniswapV3',
        token0: pool.inputTokens[0].id,
        token1: pool.inputTokens[1].id,
      })
    })

    return poolsInfo
  }

  async matchBothTokens(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
    
    const poolsInfo: PoolInfo[] = []
    const result = await request(this.endpoint, matchBothTokensFunction(token1, token2, first));
    result.liquidityPools.forEach((pool: any) => {
      poolsInfo.push({
        poolId: pool.id,
        dexId: 'UniswapV3',
        token0: pool.inputTokens[0].id,
        token1: pool.inputTokens[1].id,
      })
    });

    return poolsInfo
  }

  async matchOneToken(token: string, first: number): Promise<PoolInfo[]>  {
    
    const poolsInfo: PoolInfo[] = []
    const result = await request(this.endpoint, matchOneTokenFunction(token, first));
    result.liquidityPools.forEach((pool: any) => {
      poolsInfo.push({
          poolId: pool.id,
          dexId: 'UniswapV3',
          token0: pool.inputTokens[0].id,
          token1: pool.inputTokens[1].id,
        })
    })

    return poolsInfo
  }
}

function topPoolsFunction(first: number): TypedDocumentNode<any, Record<string, unknown>> {

    return parse(gql`
    {
      liquidityPools(first:${first}, orderDirection: desc, orderBy: cumulativeVolumeUSD) {
        name
        id
        cumulativeVolumeUSD
        inputTokens {
          symbol
          id
        }
      }
    }
  `);
}

function matchBothTokensFunction(token1: string, token2:string, first:number): TypedDocumentNode<any, Record<string, unknown>>{

    return parse(gql`{
        liquidityPools(first: ${first}, orderDirection: desc, orderBy: cumulativeVolumeUSD, where: {
          and: [
            {inputTokens_: {id: "${token1.toLowerCase()}"}},
            {inputTokens_: {id: "${token2.toLowerCase()}"}}
          ]
        }
        ) {
          name
          id
          cumulativeVolumeUSD
          inputTokens {
            symbol
            id
          }
        }
      }`);
}

function matchOneTokenFunction(token: string, first: number): TypedDocumentNode<any, Record<string, unknown>> {
    
    return parse(gql`{
        liquidityPools(first: ${first}, orderDirection: desc, orderBy: cumulativeVolumeUSD, where: {
            inputTokens_: { id: "${token.toLowerCase()}" }
        }
        ) {
          name
          id
          cumulativeVolumeUSD
          inputTokens {
            symbol
            id
          }
        }
      }`); 
}