import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXFunctionality } from '../DEXFunctionalityIF';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
 
export class SushiSwapV2 implements DEXFunctionality {

  endpoint = "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange";

  async topPools(): Promise<string[]> {
    const poolIds: string[] = []
    const result = await request(this.endpoint, topPoolsFunction(100));
    result.pairs.forEach((pair: any) => {
      poolIds.push(pair.id)
    })

    return poolIds
  }

  async matchBothTokens(token1: string, token2:string): Promise<string[]>  {
    const poolIds: string[] = []
    const result = await request(this.endpoint, matchBothTokensFunction(token1, token2));
    result.pairs.forEach((pair: any) => {
      poolIds.push(pair.id)
    })

    return poolIds
  }

  async matchOneToken(token: string): Promise<string[]>  {
    const poolIds: string[] = []
    const result = await request(this.endpoint, matchOneTokenFunction(token));
    result.pairs.forEach((pair: any) => {
      poolIds.push(pair.id)
    })

    return poolIds
  }
}

function topPoolsFunction(first: number): TypedDocumentNode<any, Record<string, unknown>> {

  return parse(gql`{
    pairs (first: ${100}, orderBy: volumeUSD, orderDirection: desc){
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