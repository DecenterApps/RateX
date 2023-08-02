export { allPoolsFunction, matchBothTokensFunction, matchOneTokenFunction }

import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXFunctionality } from '../DEXFunctionalityIF';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Pool } from '../Pool'
 
export class SushiSwapV2 implements DEXFunctionality {

  endpoint = "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange";

  async allPools(): Promise<Pool[]> {
    const skip = 0
    const pools: Pool[] = []

    for(let i = 0; i <= 5; i++){
        let result = await request(this.endpoint, allPoolsFunction(1000, skip*i));
        pools.push(...this.parseToPool(result))
    }
    return pools
  }

  async matchBothTokens(token1: string, token2:string): Promise<Pool[]> {
    const result = await request(this.endpoint, matchBothTokensFunction(token1, token2));
    return this.parseToPool(result)
  }

  async matchOneToken(token: string): Promise<Pool[]> {
    const result = await request(this.endpoint, matchOneTokenFunction(token));
    return this.parseToPool(result)
  }

  parseToPool(response: any): Pool[] {
    return parseToPoolFunction(response)
  }
}

function allPoolsFunction(first: number, skip: number): TypedDocumentNode<any, Record<string, unknown>> {

  return parse(gql`{
    pairs (first: 100, skip: 0, orderBy: volumeUSD, orderDirection: desc){
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

function matchBothTokensFunction(token1: string, token2:string): TypedDocumentNode<any, Record<string, unknown>>{

  return parse(gql`{
      query {
          pairs(first: 1000, orderBy: volumeUSD, where: {
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
      }
  }`);
}

function matchOneTokenFunction(token: string): TypedDocumentNode<any, Record<string, unknown>> {

  return parse(gql`{
      query {
          pairs(first: 1000, orderBy: volumeUSD, where: {
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
      }
  }`); 
}

function parseToPoolFunction(response: any): Pool[] {

  const pools: Pool[] = []

  response.pairs.forEach((pair: any) => {
    const pool: Pool = {
      id: pair.id,
      name: pair.name,
      dexName: "SushiSwapV2",
      chainId: "42161",
      assets: [
        {
          address: pair.token0.id,
          symbol: pair.token0.symbol,
          name: pair.token0.name,
          supply: pair.reserve0,
          decimals: pair.token0.decimals
        },
        {
          address: pair.token1.id,
          symbol: pair.token1.symbol,
          name: pair.token1.name,
          supply: pair.reserve1,
          decimals: pair.token1.decimals
        }
      ],
      reserveETH: pair.reserveETH
    }
    pools.push(pool)
  })

  return pools
}