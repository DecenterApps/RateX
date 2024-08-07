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

    clone() {
        return new TickData(this.tick, this.initialized, this.liquidityNet);
    }

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

    clone() {
        const newData = new AdaptedPoolData(null);
        newData.pool = this.pool;
        newData.token0 = this.token0;
        newData.token1 = this.token1;
        newData.tickSpacing = this.tickSpacing;
        newData.fee = this.fee;
        newData.currentLiquidity = this.currentLiquidity;
        newData.currentSqrtPriceX96 = this.currentSqrtPriceX96;
        newData.ticks = this.ticks.map(e => e.clone());
        newData.currentTickIndex = this.currentTickIndex;
        return newData;
    }

    constructor(poolData: PoolData | null) {
        if (!poolData) {
            this.pool = '';
            this.token0 = '';
            this.token1 = '';
            this.tickSpacing = BigInt(0);
            this.fee = BigInt(0);
            this.currentLiquidity = BigInt(0);
            this.currentSqrtPriceX96 = BigInt(0);
            this.ticks = []
            this.currentTickIndex = 0
            return;
        }
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

    clone() {
        return new LastQuote(this.newLiquidity, this.newSqrtPriceX96, this.newTickIndex)
    }

    constructor(newLiquidity: bigint, newSqrtPriceX96: bigint, newTickIndex: number) {
        this.newLiquidity = newLiquidity;
        this.newSqrtPriceX96 = newSqrtPriceX96;
        this.newTickIndex = newTickIndex;
    }
}

export class PoolState {
    data: AdaptedPoolData;
    lastQuote: LastQuote;

    clone() {
        return new PoolState(this.data.clone(), this.lastQuote.clone())
    }

    constructor(currData: AdaptedPoolData, lastQuote: LastQuote) {
        this.data = currData;
        this.lastQuote = lastQuote;
    }
}