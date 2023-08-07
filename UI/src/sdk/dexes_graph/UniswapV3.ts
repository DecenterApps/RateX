import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../DEXGraphFunctionality';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

export default class UniswapV3 implements DEXGraphFunctionality {

  endpoint = "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum"

  static initialise(): DEXGraphFunctionality {
    return new UniswapV3()
  }

  async topPools(numPools: number): Promise<{poolId: string; dexId: string; token0: string; token1: string;}[]> {
    const poolIds: {
      poolId: string;
      dexId: string;
      token0: string;
      token1: string;
    }[] = []
      const result = await request(this.endpoint, topPoolsFunction(numPools));
      result.liquidityPools.forEach((pool: any) => {
        poolIds.push({
          poolId: pool.id,
          dexId: 'UniswapV3',
          token0: pool.inputTokens[0].id,
          token1: pool.inputTokens[1].id,
        })
      })

      return poolIds
  }

  async matchBothTokens(token1: string, token2: string, first: number): Promise<{poolId: string; dexId: string; token0: string; token1: string;}[]> {
    const poolIds: {
      poolId: string;
      dexId: string;
      token0: string;
      token1: string;
    }[] = []
    const result = await request(this.endpoint, matchBothTokensFunction(token1, token2, first));
    result.liquidityPools.forEach((pool: any) => {
      poolIds.push({
        poolId: pool.id,
        dexId: 'UniswapV3',
        token0: pool.inputTokens[0].id,
        token1: pool.inputTokens[1].id,
      })
    });

    return poolIds
  }

  async matchOneToken(token: string, first: number): Promise<{poolId: string; dexId: string; token0: string; token1: string;}[]>  {
    const poolIds: {
      poolId: string;
      dexId: string;
      token0: string;
      token1: string;
    }[] = []
    
    const result = await request(this.endpoint, matchOneTokenFunction(token, first));
    result.liquidityPools.forEach((pool: any) => {
        poolIds.push({
          poolId: pool.id,
          dexId: 'UniswapV3',
          token0: pool.inputTokens[0].id,
          token1: pool.inputTokens[1].id,
        })
    })

    return poolIds
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
        first: ${first}, liquidityPools(orderDirection: desc, orderBy: cumulativeVolumeUSD, where: {
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