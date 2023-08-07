import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../DEXGraphFunctionality';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
 

export default class SushiSwapV2 implements DEXGraphFunctionality { 

  endpoint: string = "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange";

  static initialise(): DEXGraphFunctionality {
    return new SushiSwapV2()
  }

  async topPools(numPools: number): Promise<{poolId: string; dexId: string; token0: string; token1: string}[]> {
    const poolIds: {
      poolId: string;
      dexId: string;
      token0: string;
      token1: string;
    }[] = []
    const result = await request(this.endpoint, topPoolsFunction(numPools));
    result.pairs.forEach((pool: any) => {
      poolIds.push({
        poolId: pool.id,
        dexId: 'SushiSwapV2',
        token0: pool.token0.id,
        token1: pool.token1.id
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
    result.pairs.forEach((pool: any) => {
      poolIds.push({
        poolId: pool.id,
        dexId: 'SushiSwapV2',
        token0: pool.token0.id,
        token1: pool.token1.id
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

    result.pairs.forEach((pool: any) => {
      poolIds.push({
        poolId: pool.id,
        dexId: 'SushiSwapV2',
        token0: pool.token0.id,
        token1: pool.token1.id,
      })
    })

    return poolIds
  }
}

function topPoolsFunction(first: number): TypedDocumentNode<any, Record<string, unknown>> {

  return parse(gql`{
    pairs (first: ${first}, orderBy: volumeUSD, orderDirection: desc){
      id
      token0 {
        symbol
        id
        name
        decimals
      }
      token1 {
        symbol
        id
        name
        decimals
      }
      name
      reserve0
      reserve1
      reserveETH
    }
  }
`);

}

function matchBothTokensFunction(token1: string, token2:string, first:number): TypedDocumentNode<any, Record<string, unknown>>{

  return parse(gql`{
        pairs(first: ${first}, orderBy: volumeUSD, where: {
          or: [
            {and: [
              { token0: "${token1.toLowerCase()}" },
              { token1: "${token2.toLowerCase()}" }
              ]},
            {
              and: [
              { token0: "${token2.toLowerCase()}" },
              { token1: "${token1.toLowerCase()}" }
              ]
            }
          ]
          
        }) {
        id
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
        reserve0
        reserve1
        reserveETH
        }
  }`);
}

function matchOneTokenFunction(token: string, first: number): TypedDocumentNode<any, Record<string, unknown>> {

  return parse(gql`{
        pairs(first: ${first}, orderBy: volumeUSD, where: {
          or: [
            { token0: "${token}" },
            { token1: "${token}" }
          ]
        }) {
          id
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
          reserve0
          reserve1
          reserveETH
        }
  }`); 
}