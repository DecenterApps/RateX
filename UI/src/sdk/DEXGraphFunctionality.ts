// Define the type for poolIds
export type PoolInfo = {
    poolId: string;
    dexId: string;
    token0: string;
    token1: string;
};

export interface DEXGraphFunctionality {

    //initialize: () => DEXGraphFunctionality
    topPools: (numPools: number) => Promise<PoolInfo[]>
    matchBothTokens: (token1: string, token2: string, first: number) => Promise<PoolInfo[]>
    matchOneToken: (token: string, first: number) =>Promise<PoolInfo[]>
}

