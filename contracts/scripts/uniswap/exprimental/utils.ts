import {AdaptedPoolData, LastQuote, PoolData, PoolInfo, PoolState, TickData} from "./types";

export function convertRowPoolData(poolData: any): PoolData {

    const getPoolInfo = (poolInfoRaw: any): PoolInfo => {
        const pool: string = poolInfoRaw[0];
        const token0: string = poolInfoRaw[1];
        const token1: string = poolInfoRaw[2];
        const tick: bigint = poolInfoRaw[3];
        const tickLiquidityNet: bigint = poolInfoRaw[4];
        const tickSpacing: bigint = poolInfoRaw[5];
        const fee: bigint = poolInfoRaw[6];
        const sqrtPriceX96: bigint = poolInfoRaw[7];
        const liquidity: bigint = poolInfoRaw[8];

        return new PoolInfo(
            pool,
            token0,
            token1,
            tick,
            tickLiquidityNet,
            tickSpacing,
            fee,
            sqrtPriceX96,
            liquidity
        );
    }

    const getTickData = (tickDataRaw: any): TickData => {
        const tick: bigint = tickDataRaw[0];
        const initialized: boolean = tickDataRaw[1];
        const liquidityNet: bigint = tickDataRaw[2];

        return new TickData(
            tick,
            initialized,
            liquidityNet
        );
    }

    const zeroForOneTicksRaw = poolData[1];
    const zeroForOneTicks: TickData[] = [];
    for (let i = 0; i < zeroForOneTicksRaw.length; i++) {
        zeroForOneTicks.push(getTickData(zeroForOneTicksRaw[i]));
    }

    const oneForZeroTicksRaw = poolData[2];
    const oneForZeroTicks: TickData[] = [];
    for (let i = 0; i < oneForZeroTicksRaw.length; i++) {
        oneForZeroTicks.push(getTickData(oneForZeroTicksRaw[i]));
    }

    return new PoolData(
        getPoolInfo(poolData[0]),
        zeroForOneTicks,
        oneForZeroTicks
    );
}

export function convertInitialPoolDataToPoolState(poolData: PoolData): PoolState {
    const adaptedPoolData = new AdaptedPoolData(poolData);
    const lastQuote = new LastQuote(
        adaptedPoolData.currentLiquidity,
        adaptedPoolData.currentSqrtPriceX96,
        adaptedPoolData.currentTickIndex
    );

    return new PoolState(adaptedPoolData, lastQuote);
}


