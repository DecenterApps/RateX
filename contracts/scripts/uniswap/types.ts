export class PoolInfo {
    pool: string;
    tick: bigint;
    tickSpacing: bigint;
    fee: bigint;
    sqrtPriceX96: bigint;
    liquidity: bigint;

    constructor(pool: string, tick: bigint, tickSpacing: bigint, fee: bigint, sqrtPriceX96: bigint, liquidity: bigint) {
        this.pool = pool;
        this.tick = tick;
        this.tickSpacing = tickSpacing;
        this.fee = fee;
        this.sqrtPriceX96 = sqrtPriceX96;
        this.liquidity = liquidity;
    }
}

export class TickData {
    tick: bigint;
    initialized: boolean;
    liquidityNet: bigint;

    constructor(tick: bigint, initialized: boolean, liquidityNet: bigint) {
        this.tick = tick;
        this.initialized = initialized;
        this.liquidityNet = liquidityNet;
    }
}

export class PoolData {
    info: PoolInfo;
    zeroForOneTicks: TickData[];
    oneForZeroTicks: TickData[];

    constructor(info: PoolInfo, zeroForOneTicks: TickData[], oneForZeroTicks: TickData[]) {
        this.info = info;
        this.zeroForOneTicks = zeroForOneTicks;
        this.oneForZeroTicks = oneForZeroTicks;
    }
}

export type SwapState = {
    amountSpecifiedRemaining: bigint,
    amountCalculated: bigint,
    sqrtPriceX96: bigint,
    tick: bigint,
    liquidity: bigint
}

export type StepComputations = {
    sqrtPriceStartX96: bigint,
    tickNext: bigint,
    initialized: boolean,
    sqrtPriceNextX96: bigint,
    amountIn: bigint,
    amountOut: bigint,
    feeAmount: bigint
}
