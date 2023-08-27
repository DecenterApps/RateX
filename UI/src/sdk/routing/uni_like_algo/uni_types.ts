import {Pool} from "../../types";

export interface TRoute {
    pools: Pool[],
    tokenIn: string,
    tokenOut: string
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