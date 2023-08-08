import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality, PoolInfo } from '../DEXGraphFunctionality';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

export default class DEXName implements DEXGraphFunctionality {

    endpoint = ""

    static initialize(): DEXGraphFunctionality {
        return new DEXName()
    }

    async topPools(): Promise<PoolInfo[]> {
        
        const poolsInfo: PoolInfo[] = []
        const result = await request(this.endpoint, topPoolsFunction(100));
        result.pairs.forEach((pair: any) => {
            poolsInfo.push(pair.id)
        })
    
        return poolsInfo
    }
    
    async matchBothTokens(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
        
        const poolsInfo: PoolInfo[] = []
        const result = await request(this.endpoint, matchBothTokensFunction(token1, token2, first));
        result.pairs.forEach((pair: any) => {
            poolsInfo.push(pair.id);
        });
    
        return poolsInfo
    }
    
    async matchOneToken(token: string): Promise<PoolInfo[]> {
        
        const poolsInfo: PoolInfo[] = []
        const result = await request(this.endpoint, matchOneTokenFunction(token));
        result.pairs.forEach((pair: any) => {
            poolsInfo.push(pair.id)
        })
    
        return poolsInfo
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