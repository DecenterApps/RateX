import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXFunctionality } from '../DEXFunctionalityIF';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

export class UniswapV3 implements DEXFunctionality {

    endpoint = "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum"

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