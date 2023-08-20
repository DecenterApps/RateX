import {config} from "../../addresses.config";
import {FeeAmount, LiquidityMath, SwapMath, Tick, TickMath} from "@uniswap/v3-sdk";
import JSBI from "jsbi";
import {PoolData, PoolInfo, StepComputations, SwapState, TickData} from "./types";

const hre = require("hardhat");

const addresses = config[hre.network.config.chainId];

async function deployTestQuoter() {
    const Quoter = await hre.ethers.getContractFactory("QuoterTest");
    const quoter = await Quoter.deploy();
    await quoter.waitForDeployment();
    return {quoter};
}

async function deployUniswapHelper() {
    const UniswapHelper = await hre.ethers.getContractFactory("UniswapHelper");
    const uniswapHelper = await UniswapHelper.deploy();
    await uniswapHelper.waitForDeployment();
    return {uniswapHelper};
}

async function main() {
    const _pools: string[] = [
        addresses.univ3_wbtc_eth_pool_0_3
    ];

    const {uniswapHelper} = await deployUniswapHelper();
    const { quoter } = await deployTestQuoter();

    const myQuoterResult = await quoter.estimateAmountOut(
        addresses.wethToken,
        addresses.wbtcToken,
        hre.ethers.parseEther("100"),
        3000
    );

    const rez = await uniswapHelper.fetchData(_pools, 15);

    const poolData: PoolData = convertRowPoolData(rez[0]);
    const amountIn = hre.ethers.parseEther("100");
    const zeroForOne: boolean = false; // rewrite this later
    const sqrtPriceLimitX96 = zeroForOne ?
        JSBI.add(TickMath.MIN_SQRT_RATIO, JSBI.BigInt("1")) :
        JSBI.subtract(TickMath.MAX_SQRT_RATIO, JSBI.BigInt("1"));


    const resultFromChain = await uniswapHelper.offchainQuote(
        poolData,
        amountIn,
        BigInt(sqrtPriceLimitX96.toString()),
        zeroForOne
    );

    const offchainResult = quote(
        poolData,
        amountIn,
        BigInt(sqrtPriceLimitX96.toString()),
        zeroForOne
    );

    console.log("My quoter result: ", myQuoterResult);
    console.log("On-chain quoter result: ", resultFromChain);
    console.log("Off-chain quoter result: ", offchainResult[0]);
}

// main off chain quote function
function quote(
    poolData: PoolData,
    amountIn: bigint,
    sqrtPriceLimitX96: bigint,
    zeroForOne: boolean
): [bigint, bigint] {
    if (amountIn <= BigInt(0)) throw new Error("Amount specified must be greater than 0");

    const ticksData = zeroForOne ? poolData.zeroForOneTicks : poolData.oneForZeroTicks;
    let state: SwapState = initSwapState(poolData, amountIn);
    let tickDataIndex = 0;

    while (
        state.amountSpecifiedRemaining !== BigInt(0) &&
        state.sqrtPriceX96 !== sqrtPriceLimitX96 &&
        tickDataIndex < ticksData.length)
    {
        const tickData = ticksData[tickDataIndex];

        let step: StepComputations = initStepComputations(state, tickData);

        updateSwapIteration(state, step, tickData, poolData.info.fee, sqrtPriceLimitX96, zeroForOne);

        tickDataIndex++;
    }

    const amountOut = state.amountCalculated > BigInt(0) ? state.amountCalculated : -state.amountCalculated;
    return [amountOut, state.amountSpecifiedRemaining];
}

function initSwapState(poolData: PoolData, amountIn: bigint): SwapState {
    return  {
        amountSpecifiedRemaining: amountIn,
        amountCalculated: BigInt(0),
        sqrtPriceX96: poolData.info.sqrtPriceX96,
        tick: poolData.info.tick,
        liquidity: poolData.info.liquidity
    };
}

function initStepComputations(state: SwapState, tickData: TickData): StepComputations {
    return {
        sqrtPriceStartX96: state.sqrtPriceX96,
        tickNext: tickData.tick,
        initialized: tickData.initialized,
        sqrtPriceNextX96: BigInt(TickMath.getSqrtRatioAtTick(Number(tickData.tick)).toString()),
        amountIn: BigInt(0),
        amountOut: BigInt(0),
        feeAmount: BigInt(0)
    };
}

function convertToFeeAmount(fee: bigint): FeeAmount {
    switch (fee.toString()) {
        case "500":
            return FeeAmount.LOW;
        case "3000":
            return FeeAmount.MEDIUM;
        case "10000":
            return FeeAmount.HIGH;
        default:
            throw new Error("Invalid fee amount");
    }
}

function updateSwapIteration(
    state: SwapState,
    step: StepComputations,
    tickData: TickData,
    fee: bigint,
    sqrtPriceLimitX96: bigint,
    zeroForOne: boolean
) {
    updateSwapStep(state, step, fee, sqrtPriceLimitX96, zeroForOne);
    calculateAmount(state, step);
    updateTickWithLiquidity(state, step, tickData, zeroForOne);
}

function updateSwapStep(
    state: SwapState,
    step: StepComputations,
    fee: bigint,
    sqrtPriceLimitX96: bigint,
    zeroForOne: boolean
) {
    const [sqrtPriceX96, amountIn, amountOut, feeAmount] =
        SwapMath.computeSwapStep(
            JSBI.BigInt(state.sqrtPriceX96.toString()),
            calculateRatioTargetX96(zeroForOne, step.sqrtPriceNextX96, sqrtPriceLimitX96),
            JSBI.BigInt(state.liquidity.toString()),
            JSBI.BigInt(state.amountSpecifiedRemaining.toString()),
            convertToFeeAmount(fee)
        );

    state.sqrtPriceX96 = BigInt(sqrtPriceX96.toString());
    step.amountIn = BigInt(amountIn.toString());
    step.amountOut = BigInt(amountOut.toString());
    step.feeAmount = BigInt(feeAmount.toString());
}

function calculateAmount(state: SwapState, step: StepComputations) {
    state.amountSpecifiedRemaining -= (step.amountIn + step.feeAmount);
    state.amountCalculated -= step.amountOut;
}

function updateTickWithLiquidity(
    state: SwapState,
    step: StepComputations,
    tickData: TickData,
    zeroForOne: boolean
) {
    if (state.sqrtPriceX96 === step.sqrtPriceNextX96) {
        // if the tick is initialized, run the tick transition
        if (step.initialized) {
            let liquidityNet = tickData.liquidityNet;
            // if we're moving leftward, we interpret liquidityNet as the opposite sign
            if (zeroForOne) {
                liquidityNet = -liquidityNet;
            }
            const finalLiquidity = LiquidityMath.addDelta(
                JSBI.BigInt(state.liquidity.toString()),
                JSBI.BigInt(liquidityNet.toString())
            );
            state.liquidity = BigInt(finalLiquidity.toString());
        }
        state.tick = zeroForOne ? step.tickNext - BigInt(1) : step.tickNext;
    } else if (state.sqrtPriceX96 !== step.sqrtPriceStartX96) {
        // recompute unless we're on a lower tick boundary (i.e. already transitioned ticks), and haven't moved
        const tick = TickMath.getTickAtSqrtRatio(JSBI.BigInt(state.sqrtPriceX96.toString()));
        state.tick = BigInt(tick.toString());
    }
}

function calculateRatioTargetX96(
    zeroForOne: boolean,
    sqrtPriceNextX96: bigint,
    sqrtPriceLimitX96: bigint
): JSBI {
    return (zeroForOne ? sqrtPriceNextX96 < sqrtPriceLimitX96 : sqrtPriceNextX96 > sqrtPriceLimitX96)
        ? JSBI.BigInt(sqrtPriceLimitX96.toString())
        : JSBI.BigInt(sqrtPriceNextX96.toString());
}

function convertRowPoolData(poolData): PoolData {

    const getPoolInfo = (poolInfoRaw): PoolInfo => {
        const pool: string = poolInfoRaw[0];
        const tick: bigint = poolInfoRaw[1];
        const tickSpacing: bigint = poolInfoRaw[2];
        const fee: bigint = poolInfoRaw[3];
        const sqrtPriceX96: bigint = poolInfoRaw[4];
        const liquidity: bigint = poolInfoRaw[5];

        return new PoolInfo(
            pool,
            tick,
            tickSpacing,
            fee,
            sqrtPriceX96,
            liquidity
        );
    }

    const getTickData = (tickDataRaw): TickData => {
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


main();