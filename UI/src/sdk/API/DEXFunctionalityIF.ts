
export interface DEXFunctionality {

    topPools: () => Promise<string[]>
    matchBothTokens: (token1: string, token2:string) => Promise<string[]>
    matchOneToken: (token: string) =>Promise<string[]>
}

