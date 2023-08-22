import {PoolData, StepComputations, SwapState, TickData} from "./types";
import {FeeAmount, LiquidityMath, SwapMath, TickMath} from "@uniswap/v3-sdk";
import JSBI from "jsbi";

export class UniswapOffchainQuoter {

    public quote(
        poolData: PoolData,
        tokenIn: string,
        tokenOut: string,
        amountIn: bigint
    ): [bigint, bigint] {
        const zeroForOne: boolean = tokenIn < tokenOut;
        const sqrtPriceLimitX96 = this.getSqrtPriceLimitX96(zeroForOne);

        if (amountIn <= BigInt(0)) throw new Error("Amount specified must be greater than 0");

        const ticksData = zeroForOne ? poolData.zeroForOneTicks : poolData.oneForZeroTicks;
        let state: SwapState = this.initSwapState(poolData, amountIn);
        let tickDataIndex = 0;

        while (
            state.amountSpecifiedRemaining !== BigInt(0) &&
            state.sqrtPriceX96 !== sqrtPriceLimitX96 &&
            tickDataIndex < ticksData.length)
        {
            const tickData = ticksData[tickDataIndex];

            let step: StepComputations = this.initStepComputations(state, tickData);

            this.updateSwapIteration(state, step, tickData, poolData.info.fee, sqrtPriceLimitX96, zeroForOne);

            tickDataIndex++;
        }

        const amountOut = state.amountCalculated > BigInt(0) ? state.amountCalculated : -state.amountCalculated;
        return [amountOut, state.amountSpecifiedRemaining];
    }


    private initSwapState(poolData: PoolData, amountIn: bigint): SwapState {
        return  {
            amountSpecifiedRemaining: amountIn,
            amountCalculated: BigInt(0),
            sqrtPriceX96: poolData.info.sqrtPriceX96,
            tick: poolData.info.tick,
            liquidity: poolData.info.liquidity
        };
    }

    private initStepComputations(state: SwapState, tickData: TickData): StepComputations {
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

    private convertToFeeAmount(fee: bigint): FeeAmount {
        switch (fee.toString()) {
            case "100":
                return FeeAmount.LOWEST;
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

    private updateSwapIteration(
        state: SwapState,
        step: StepComputations,
        tickData: TickData,
        fee: bigint,
        sqrtPriceLimitX96: bigint,
        zeroForOne: boolean
    ) {
        this.updateSwapStep(state, step, fee, sqrtPriceLimitX96, zeroForOne);
        this.calculateAmount(state, step);
        this.updateTickWithLiquidity(state, step, tickData, zeroForOne);
    }

    private updateSwapStep(
        state: SwapState,
        step: StepComputations,
        fee: bigint,
        sqrtPriceLimitX96: bigint,
        zeroForOne: boolean
    ) {
        const [sqrtPriceX96, amountIn, amountOut, feeAmount] =
            SwapMath.computeSwapStep(
                JSBI.BigInt(state.sqrtPriceX96.toString()),
                this.calculateRatioTargetX96(zeroForOne, step.sqrtPriceNextX96, sqrtPriceLimitX96),
                JSBI.BigInt(state.liquidity.toString()),
                JSBI.BigInt(state.amountSpecifiedRemaining.toString()),
                this.convertToFeeAmount(fee)
            );

        state.sqrtPriceX96 = BigInt(sqrtPriceX96.toString());
        step.amountIn = BigInt(amountIn.toString());
        step.amountOut = BigInt(amountOut.toString());
        step.feeAmount = BigInt(feeAmount.toString());
    }

    private calculateAmount(state: SwapState, step: StepComputations) {
        state.amountSpecifiedRemaining -= (step.amountIn + step.feeAmount);
        state.amountCalculated -= step.amountOut;
    }

    private updateTickWithLiquidity(
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

    private calculateRatioTargetX96(
        zeroForOne: boolean,
        sqrtPriceNextX96: bigint,
        sqrtPriceLimitX96: bigint
    ): JSBI {
        return (zeroForOne ? sqrtPriceNextX96 < sqrtPriceLimitX96 : sqrtPriceNextX96 > sqrtPriceLimitX96)
            ? JSBI.BigInt(sqrtPriceLimitX96.toString())
            : JSBI.BigInt(sqrtPriceNextX96.toString());
    }

    private getSqrtPriceLimitX96(zeroForOne: boolean): bigint {
        return zeroForOne ?
            BigInt(JSBI.add(TickMath.MIN_SQRT_RATIO, JSBI.BigInt("1")).toString()) :
            BigInt(JSBI.subtract(TickMath.MAX_SQRT_RATIO, JSBI.BigInt("1")).toString());
    }
}
