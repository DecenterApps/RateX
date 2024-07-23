// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {IUniswapV3PoolImmutables} from "@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolImmutables.sol";

import {TickBitmap} from "./libraries/TickBitmap.sol";
import {TickMath} from "./libraries/TickMath.sol";
import {LowGasSafeMath} from "./libraries/LowGasSafeMath.sol";
import {LiquidityMath} from "./libraries/LiquidityMath.sol";
import {SwapMath} from "./libraries/SwapMath.sol";
import {SafeCast} from "./libraries/SafeCast.sol";

import {IUniswapState} from "./interfaces/IUniswapState.sol";
import {IUniswapHelper, IUniswapViewQuoter} from "./interfaces/IUniswapHelper.sol";

abstract contract UniViewQuoter is IUniswapState, IUniswapViewQuoter {
    using LowGasSafeMath for uint256;
    using LowGasSafeMath for int256;
    using SafeCast for uint256;
    using SafeCast for int256;

    function estimateAmountOut(
        address _pool,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) public view returns (uint256) {
        bool zeroForOne = _tokenIn < _tokenOut;
        return _quoteSwapExactAmount(
            _pool,
            int256(_amountIn),
            zeroForOne ? (TickMath.MIN_SQRT_RATIO + 1) : (TickMath.MAX_SQRT_RATIO - 1),
            zeroForOne
        );
    }

    function _quoteSwapExactAmount(
        address _poolAddress,
        int256 _amountIn,
        uint160 _sqrtPriceLimitX96,
        bool _zeroForOne
    ) internal view returns (uint256 amountOut) {
        require(_amountIn > 0, "Amount specified must be greater than 0");

        (int24 tickSpacing, uint24 fee, SwapState memory state) = _getInitState(_poolAddress, _amountIn);

        while (state.amountSpecifiedRemaining != 0 && state.sqrtPriceX96 != _sqrtPriceLimitX96) {

            StepComputations memory step;
            step.sqrtPriceStartX96 = state.sqrtPriceX96;

            (step.tickNext, step.initialized, step.sqrtPriceNextX96) = _getNextTick(
                _poolAddress,
                state.tick,
                tickSpacing,
                _zeroForOne
            );

            (state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount) = SwapMath.computeSwapStep(
                state.sqrtPriceX96,
                (_zeroForOne ? step.sqrtPriceNextX96 < _sqrtPriceLimitX96 : step.sqrtPriceNextX96 > _sqrtPriceLimitX96)
                    ? _sqrtPriceLimitX96
                    : step.sqrtPriceNextX96,
                state.liquidity,
                state.amountSpecifiedRemaining,
                fee
            );

            state.amountSpecifiedRemaining -= (step.amountIn + step.feeAmount).toInt256();
            state.amountCalculated = state.amountCalculated.sub(step.amountOut.toInt256());

            int128 liquidityNet = 0;

            // shift tick if we reached the next price
            if (state.sqrtPriceX96 == step.sqrtPriceNextX96) {
                // if the tick is initialized, run the tick transition
                if (step.initialized) {
                    (, liquidityNet,,,,,,) = IUniswapV3Pool(_poolAddress).ticks(step.tickNext);
                    // if we're moving leftward, we interpret liquidityNet as the opposite sign
                    // safe because liquidityNet cannot be type(int128).min
                    if (_zeroForOne)
                        liquidityNet = - liquidityNet;
                    state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet);
                }
                state.tick = _zeroForOne ? step.tickNext - 1 : step.tickNext;
            } else if (state.sqrtPriceX96 != step.sqrtPriceStartX96) {
                // recompute unless we're on a lower tick boundary (i.e. already transitioned ticks), and haven't moved
                state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
            }
        }
        amountOut = state.amountCalculated > 0 ? uint256(state.amountCalculated) : uint256(- state.amountCalculated);
    }

    function _getInitState(
        address _poolAddress,
        int256 _amountIn
    )
    internal view returns (int24 tickSpacing, uint24 fee, SwapState memory state)
    {
        tickSpacing = IUniswapV3PoolImmutables(_poolAddress).tickSpacing();
        fee = IUniswapV3PoolImmutables(_poolAddress).fee();
        uint128 liquidity = IUniswapV3Pool(_poolAddress).liquidity();
        (uint160 sqrtPriceX96, int24 tick, , , , ,) = IUniswapV3Pool(_poolAddress).slot0();
        state = SwapState({
            amountSpecifiedRemaining: _amountIn,
            amountCalculated: 0,
            sqrtPriceX96: sqrtPriceX96,
            tick: tick,
            liquidity: liquidity
        });
    }

    function _getNextTick(
        address _poolAddress,
        int24 _tick,
        int24 _tickSpacing,
        bool _zeroForOne
    )
    internal view returns (int24 tickNext, bool initialized, uint160 sqrtPriceNextX96)
    {
        (tickNext, initialized) = TickBitmap.nextInitializedTickWithinOneWord(
            _poolAddress,
            _tick,
            _tickSpacing,
            _zeroForOne
        );

        if (tickNext < TickMath.MIN_TICK) {
            tickNext = TickMath.MIN_TICK;
        } else if (tickNext > TickMath.MAX_TICK) {
            tickNext = TickMath.MAX_TICK;
        }

        sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(tickNext);
    }
}
