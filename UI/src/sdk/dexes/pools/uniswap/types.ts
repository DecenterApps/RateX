export class PoolInfo {
    pool: string;
    token0: string;
    token1: string;
    tick: bigint;
    tickLiquidityNet: bigint;
    tickSpacing: bigint;
    fee: bigint;
    sqrtPriceX96: bigint;
    liquidity: bigint;

    constructor(pool: string, token0: string, token1: string, tick: bigint, tickLiquidityNet: bigint, tickSpacing: bigint, fee: bigint, sqrtPriceX96: bigint, liquidity: bigint) {
        this.pool = pool;
        this.token0 = token0;
        this.token1 = token1;
        this.tick = tick;
        this.tickLiquidityNet = tickLiquidityNet
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


// helper used for test
export class TradeInfo {
    pool: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: bigint;
    fee: bigint;

    constructor(pool: string, tokenIn: string, tokenOut: string, amountIn: bigint, fee: bigint) {
        this.pool = pool;
        this.tokenIn = tokenIn;
        this.tokenOut = tokenOut;
        this.amountIn = amountIn;
        this.fee = fee;
    }
}

export class AdaptedPoolData {
    pool: string;
    token0: string;
    token1: string;
    tickSpacing: bigint;
    fee: bigint;
    currentLiquidity: bigint;
    currentSqrtPriceX96: bigint;
    ticks: TickData[];

    currentTickIndex: number; // currenTick info is at ticks[currentTickIndex]

    constructor(poolData: PoolData) {
        this.pool = poolData.info.pool;
        this.token0 = poolData.info.token0;
        this.token1 = poolData.info.token1;
        this.tickSpacing = poolData.info.tickSpacing;
        this.fee = poolData.info.fee;
        this.currentLiquidity = poolData.info.liquidity;
        this.currentSqrtPriceX96 = poolData.info.sqrtPriceX96;

        const currentTickData = new TickData(poolData.info.tick, true, poolData.info.tickLiquidityNet);
        this.ticks = poolData.zeroForOneTicks.reverse().concat(currentTickData).concat(poolData.oneForZeroTicks);
        this.currentTickIndex = poolData.zeroForOneTicks.length;
    }

    public getCurrTickData(): TickData {
        return this.ticks[this.currentTickIndex];
    }
}

export class LastQuote {
    newLiquidity: bigint;
    newSqrtPriceX96: bigint;
    newTickIndex: number; // index in array of ticks

    constructor(newLiquidity: bigint, newSqrtPriceX96: bigint, newTickIndex: number) {
        this.newLiquidity = newLiquidity;
        this.newSqrtPriceX96 = newSqrtPriceX96;
        this.newTickIndex = newTickIndex;
    }
}

export class PoolState {
    data: AdaptedPoolData;
    lastQuote: LastQuote;

    constructor(currData: AdaptedPoolData, lastQuote: LastQuote) {
        this.data = currData;
        this.lastQuote = lastQuote;
    }
}