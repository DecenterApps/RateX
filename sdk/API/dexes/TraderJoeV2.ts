export { allPoolsFunction, matchBothTokensFunction, matchOneTokenFunction }

import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXFunctionality } from '../DEXFunctionalityIF';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Pool } from '../Pool'

export class TraderJoeV2 implements DEXFunctionality {

  endpoint: string = "https://api.thegraph.com/subgraphs/name/traderjoe-xyz/joe-v2-arbitrum"

    async allPools(): Promise<Pool[]> {
        const result = await request(this.endpoint, allPoolsFunction(10, 0));
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

    return parse(gql`
    {
      lbpairs(orderBy: volumeUSD, orderDirection: desc, first: ${first}, skip: ${skip}){
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

function matchBothTokensFunction(token1: string, token2:string): TypedDocumentNode<any, Record<string, unknown>>{

    return parse(gql`{
      lbpairs(orderBy: volumeUSD, orderDirection: desc, where: {
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

function parseToPoolFunction(response: any): Pool[] {
    const pools: Pool[] = []

    response.lbpairs.forEach((pair: any) => {
      console.log(pair.id)
      const pool: Pool = {
        id: pair.id,
        name: pair.name,
        dexName: "TraderJoeV2",
        chainId: "42161",
        assets: [
          {
            address: pair.tokenX.id,
            symbol: pair.tokenX.symbol,
            name: pair.tokenX.name,
            supply: pair.tokenX.totalSupply,
            decimals: pair.tokenX.decimals
          },
          {
            address: pair.tokenY.id,
            symbol: pair.tokenY.symbol,
            name: pair.tokenY.name,
            supply: pair.tokenY.totalSupply,
            decimals: pair.tokenY.decimals
          }
        ]
      }
      pools.push(pool)
    })
  
    return pools
}
