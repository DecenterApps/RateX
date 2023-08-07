import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../DEXGraphFunctionality';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

export class TraderJoeV2 implements DEXGraphFunctionality {

  endpoint: string = "https://api.thegraph.com/subgraphs/name/traderjoe-xyz/joe-v2-arbitrum"

  initialise(): DEXGraphFunctionality {
    return new TraderJoeV2()
  }

  async topPools(): Promise<string[]> {
    const poolIds: string[] = []
    const result = await request(this.endpoint, topPoolsFunction(100));
    result.pairs.forEach((pair: any) => {
      poolIds.push(pair.id)
    })

    return poolIds
  }

  async matchBothTokens(token1: string, token2: string, first: number): Promise<{ [dex: string]: string[] }> {
    const poolIds: string[] = [];
    const result = await request(this.endpoint, matchBothTokensFunction(token1, token2, first));
    result.pairs.forEach((pair: any) => {
        poolIds.push(pair.id);
    });

    return {'TraderJoeV2': poolIds }
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

    return parse(gql`
    {
      lbpairs(orderBy: volumeUSD, orderDirection: desc, first: ${first}){
        id
        name
        tokenX {
          id
          symbol
          name
          totalSupply
          decimals
        }
        tokenY {
          id
          symbol
          name
          totalSupply
          decimals
        }
        totalValueLockedUSD
      }
    }
  `);
}

function matchBothTokensFunction(token1: string, token2:string, first:number): TypedDocumentNode<any, Record<string, unknown>>{

    return parse(gql`{
      lbpairs(first: ${first}, orderBy: volumeUSD, orderDirection: desc, where: {
        or: [
          {
            and: [
              { tokenX_: "${token1.toLowerCase()}" },
              { tokenY_: "${token2.toLowerCase()}" }
            ]
          },
          {
            and: [
              { tokenX_: "${token2.toLowerCase()}" },
              { tokenY_: "${token1.toLowerCase()}" }
            ]
          }
        ]
      }) {
        id
        name
        tokenX {
          id
          symbol
          name
          totalSupply
          decimals
        }
        tokenY {
          id
          symbol
          name
          totalSupply
          decimals
        }
        totalValueLockedUSD
      }
    }`);
}

function matchOneTokenFunction(token: string): TypedDocumentNode<any, Record<string, unknown>> {
    
    return parse(gql`{
      lbpairs(orderBy: volumeUSD, orderDirection: desc, where: {
        or: [
          { tokenX_: "${token.toLowerCase()}" },
          { tokenY_: "${token.toLowerCase()}" }
        ]
      }) {
        id
        name
        tokenX {
          id
          symbol
          name
          totalSupply
          decimals
        }
        tokenY {
          id
          symbol
          name
          totalSupply
          decimals
        }
        totalValueLockedUSD
      }
    }`); 
}
