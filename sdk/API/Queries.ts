import { TypedDocumentNode } from '@graphql-typed-document-node/core';

export interface Queries {

    allPools: (first: number, skip: number) => any
    matchBothTokens: (token1: string, token2:string) => any
    matchOneToken: (token: string) => any
}