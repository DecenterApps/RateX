import {FeeAmount, LiquidityMath, SwapMath, TickMath} from "@uniswap/v3-sdk";
import JSBI from "jsbi";
import {PoolState, StepComputations, SwapState, TickData} from "./types";

export class UniswapOffchainQuoter {

    public quote(
        poolState: PoolState,
        tokenIn: string,
        tokenOut: string,
        amountIn: bigint
    ): [bigint, bigint] {

        if (amountIn <= BigInt(0)) {
          return [BigInt(0), BigInt(0)];
        }

        try {
            const zeroForOne: boolean = tokenIn < tokenOut;
            const sqrtPriceLimitX96 = this.getSqrtPriceLimitX96(zeroForOne);

            let state: SwapState = this.initSwapState(poolState, amountIn);

            let tickDataIndex = zeroForOne
                ? poolState.data.currentTickIndex - 1
                : poolState.data.currentTickIndex + 1;

            while (
                state.amountSpecifiedRemaining !== BigInt(0) &&
                state.sqrtPriceX96 !== sqrtPriceLimitX96 &&
                tickDataIndex >= 0 &&
                tickDataIndex < poolState.data.ticks.length
                ) {
                const tickData = poolState.data.ticks[tickDataIndex];

                let step: StepComputations = this.initStepComputations(state, tickData);

                this.updateSwapIteration(state, step, tickData, poolState.data.fee, sqrtPriceLimitX96, zeroForOne);

                tickDataIndex = zeroForOne ? tickDataIndex - 1 : tickDataIndex + 1;
            }

            // remember where we left off, so we can update pool later
            poolState.lastQuote = {
                newLiquidity: state.liquidity,
                newSqrtPriceX96: state.sqrtPriceX96,
                newTickIndex: zeroForOne ? tickDataIndex + 2 : tickDataIndex - 2
            }

            const amountOut = state.amountCalculated > BigInt(0) ? state.amountCalculated : -state.amountCalculated;
            return [amountOut, state.amountSpecifiedRemaining];
        } catch (e) {
            return [BigInt(0), BigInt(0)];
        }
    }

    private initSwapState(poolState: PoolState, amountIn: bigint): SwapState {
        return  {
            amountSpecifiedRemaining: amountIn,
            amountCalculated: BigInt(0),
            sqrtPriceX96: poolState.data.currentSqrtPriceX96,
            tick: poolState.data.getCurrTickData().tick,
            liquidity: poolState.data.currentLiquidity
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
