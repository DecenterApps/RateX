export { allPoolsFunction, matchBothTokensFunction, matchOneTokenFunction }

import { parse } from 'graphql';
import { gql, request } from 'graphql-request'
import { DEXFunctionality } from '../DEXFunctionalityIF';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { Pool } from '../Pool'

export class DEXName implements DEXFunctionality {

    endpoint = ""

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
    return parse(gql``);
}

function matchBothTokensFunction(token1: string, token2:string): TypedDocumentNode<any, Record<string, unknown>>{
    return parse(gql``);
}

function matchOneTokenFunction(token: string): TypedDocumentNode<any, Record<string, unknown>> {
    return parse(gql``);
}

function parseToPoolFunction(response: any): Pool[] {
    return []
}