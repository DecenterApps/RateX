// Define the type for poolIds - returned by the Graph API
// In future will have chainId
export type PoolInfo = {
    poolId: string;
    dexId: string;
    token0: string;     // address
    token1: string;     // address
};

export interface DEXGraphFunctionality {

    topPools: (numPools: number) => Promise<PoolInfo[]>
    matchBothTokens: (token1: string, token2: string, first: number) => Promise<PoolInfo[]>
    matchOneToken: (token: string, first: number) =>Promise<PoolInfo[]>
}

