import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../DEXGraphFunctionality';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

export class DEXName implements DEXGraphFunctionality {

    endpoint = ""

    static initialise(): DEXGraphFunctionality {
        return new DEXName()
    }

    async topPools(): Promise<{poolId: string; dexId: string; token0: string; token1: string;}[]> {
        const poolIds: {
          poolId: string;
          dexId: string;
          token0: string;
          token1: string;
        }[] = []
        const result = await request(this.endpoint, topPoolsFunction(100));
        result.pairs.forEach((pair: any) => {
          poolIds.push(pair.id)
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
        result.pairs.forEach((pair: any) => {
            poolIds.push(pair.id);
        });
    
        return poolIds
    }
    
    async matchOneToken(token: string): Promise<{poolId: string; dexId: string; token0: string; token1: string;}[]> {
        const poolIds: {
          poolId: string;
          dexId: string;
          token0: string;
          token1: string;
        }[] = []
        const result = await request(this.endpoint, matchOneTokenFunction(token));
        result.pairs.forEach((pair: any) => {
          poolIds.push(pair.id)
        })
    
        return poolIds
    }
}

function topPoolsFunction(first: number): TypedDocumentNode<any, Record<string, unknown>> {
    return parse(gql``);
}

function matchBothTokensFunction(token1: string, token2: string, first: number): TypedDocumentNode<any, Record<string, unknown>>{
    return parse(gql``);
}

function matchOneTokenFunction(token: string): TypedDocumentNode<any, Record<string, unknown>> {
    return parse(gql``);
}