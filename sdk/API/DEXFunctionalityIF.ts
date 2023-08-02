import { Pool } from './Pool'

export interface DEXFunctionality {

    allPools: (first: number, skip: number) => Promise<Pool[]>
    matchBothTokens: (token1: string, token2:string) => Promise<Pool[]>
    matchOneToken: (token: string) => Promise<Pool[]>

    parseToPool: (response: any) => Pool[]
}

