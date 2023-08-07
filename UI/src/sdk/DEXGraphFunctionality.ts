
export interface DEXGraphFunctionality {

    initialise: () => DEXGraphFunctionality
    topPools: () => Promise<string[]>
    matchBothTokens: (token1: string, token2:string, first:number) => Promise<{ [dex: string]: string[] }>
    matchOneToken: (token: string) =>Promise<string[]>
}

