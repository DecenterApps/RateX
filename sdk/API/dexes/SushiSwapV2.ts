export { allPoolsFunction, matchBothTokensFunction, matchOneTokenFunction }

import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXFunctionality } from '../DEXFunctionalityIF';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Pool } from '../Pool'
 
export class SushiSwapV2 implements DEXFunctionality {

  endpoint = "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange";

  async allPools(first: number, skip: number): Promise<Pool[]> {
    const result = await request(this.endpoint, allPoolsFunction(first, skip));
    return this.parseToPool(result)
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
      }
      token1 {
        symbol
        id
      }
      reserveUSD
      totalSupply
      name
      reserve0
      reserve1
      reserveETH
      volumeUSD
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
          }
          token1 {
              id
              symbol
          }
          reserve0
          reserve1
          reserveETH
          reserveUSD
          totalSupply
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
            }
            token1 {
              id
              symbol
            }
            reserve0
            reserve1
            reserveETH
            reserveUSD
            totalSupply
          }
      }
  }`); 
}

function parseToPoolFunction(response: any): Pool[] {
  return []
}