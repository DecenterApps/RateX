import {Pool} from "../../types";

export interface TRouteStep {
    pool: Pool,
    tokenOut: string;
}

export interface TRoute {
    steps: TRouteStep[],
    tokenIn: string,
    tokenOut: string
}

export interface TRouteWithQuote {
    route: TRoute,
    quote: bigint,
    amount: AmountPercentage
}

export interface AmountPercentage {
    amountIn: bigint,
    percentage: number
}

export class ComputeRoutesParams {
    tokenIn: string;
    tokenOut: string;
    pools: Pool[];
    maxHops: number;

    constructor(tokenIn: string, tokenOut: string, pools: Pool[], maxHops: number) {
        this.tokenIn = tokenIn;
        this.tokenOut = tokenOut;
        this.pools = pools;
        this.maxHops = maxHops;
    }
}

export interface QueueItem {
    percentageIndex: number,
    currentRoutes: TRouteWithQuote[],
    ramainingPercentage: number
}

export interface TQuoteUniLike {
    routes: TRouteWithQuote[],
    quote: bigint
}

export type AlgoParams = {
    maxHops: number,
    distributionPercentage: number,
    maxSplit: number
}
