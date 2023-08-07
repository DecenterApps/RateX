
export interface DEXGraphFunctionality {

    // initialise: () => DEXGraphFunctionality
    topPools: (numPools: number) => Promise<{poolId: string; dexId: string; token0: string; token1: string;}[]>
    matchBothTokens: (token1: string, token2: string, first: number) => Promise<{poolId: string; dexId: string; token0: string; token1: string;}[]>
    matchOneToken: (token: string, first: number) =>Promise<{
        poolId: string;
        dexId: string;
        token0: string;
        token1: string;
      }[]>
}

