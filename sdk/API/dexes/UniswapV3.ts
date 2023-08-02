export { allPoolsFunction, matchBothTokensFunction, matchOneTokenFunction }

import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXFunctionality } from '../DEXFunctionalityIF';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Pool } from '../Pool'

export class UniswapV3 implements DEXFunctionality {

    endpoint = "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum"

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

    return parse(gql`
    {
      liquidityPools(first:${first}, skip:${skip}, orderDirection: desc, orderBy: cumulativeVolumeUSD) {
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

function matchBothTokensFunction(token1: string, token2:string): TypedDocumentNode<any, Record<string, unknown>>{

    return parse(gql`{
        liquidityPools(orderDirection: desc, orderBy: cumulativeVolumeUSD, where: {
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

function matchOneTokenFunction(token: string): TypedDocumentNode<any, Record<string, unknown>> {
    
    return parse(gql`{
        liquidityPools(orderDirection: desc, orderBy: cumulativeVolumeUSD, where: {
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

function parseToPoolFunction(response: any): Pool[] {
    return []
}
