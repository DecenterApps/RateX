// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolImmutables.sol";

import { TickBitmap } from "./libraries/TickBitmap.sol";
import { TickMath } from "./libraries/TickMath.sol";
import { LowGasSafeMath } from "./libraries/LowGasSafeMath.sol";
import { LiquidityMath } from "./libraries/LiquidityMath.sol";
import { SwapMath } from "./libraries/SwapMath.sol";
import { SafeCast } from "./libraries/SafeCast.sol";

import "hardhat/console.sol";
import "./interfaces/IUniswapState.sol";

contract QuoterTest is IUniswapState {
    IUniswapV3Factory internal constant uniV3Factory = IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);

    using LowGasSafeMath for uint256;
    using LowGasSafeMath for int256;
    using SafeCast for uint256;
    using SafeCast for int256;

    function estimateAmountOut(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint24 _poolFee
    ) public view returns (uint256 amountOut) {
        address pool = uniV3Factory.getPool(_tokenIn, _tokenOut, _poolFee);

        bool zeroForOne = _tokenIn < _tokenOut;
        (int256 amount0, int256 amount1) = _quoteSwapExactAmount(
            pool,
            int256(_amountIn),
            zeroForOne ? (TickMath.MIN_SQRT_RATIO + 1) : (TickMath.MAX_SQRT_RATIO - 1),
            zeroForOne
        );

        if (zeroForOne) amountOut = amount1 > 0 ? uint256(amount1) : uint256(-amount1);
        else amountOut = amount0 > 0 ? uint256(amount0) : uint256(-amount0);
    }


    function _quoteSwapExactAmount(
        address _poolAddress,
        int256 _amountIn,
        uint160 _sqrtPriceLimitX96,
        bool _zeroForOne
    ) internal view returns (int256 amount0, int256 amount1) {
        require(_amountIn > 0, "Amount specified must be greater than 0");

        (int24 tickSpacing, uint24 fee, SwapState memory state) = _getInitState(_poolAddress, _amountIn);

        console.log("Pool Address:", _poolAddress);
        console.log("Start tick: ", uint256(int256(state.tick)));

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
                    (,liquidityNet,,,,,,) = IUniswapV3Pool(_poolAddress).ticks(step.tickNext);
                    // if we're moving leftward, we interpret liquidityNet as the opposite sign
                    // safe because liquidityNet cannot be type(int128).min
                    if (_zeroForOne)
                        liquidityNet = -liquidityNet;
                    state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet);
                }
                state.tick = _zeroForOne ? step.tickNext - 1 : step.tickNext;
            } else if (state.sqrtPriceX96 != step.sqrtPriceStartX96) {
                // recompute unless we're on a lower tick boundary (i.e. already transitioned ticks), and haven't moved
                state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
            }

            console.log("Step initialized :", step.initialized);
            console.log("Tick next: ", uint256(int256(step.tickNext)));
            console.log("Liquidity net: ", uint256(int256(liquidityNet)));
            console.log("Sqrt price next:", uint256(step.sqrtPriceNextX96));
            console.log("Sqrt price:", uint256(state.sqrtPriceX96));
            console.log("-------");
        }

        (amount0, amount1) = _returnedAmount(state, _amountIn, _zeroForOne);
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
        (uint160 sqrtPriceX96, int24 tick, , , , , ) = IUniswapV3Pool(_poolAddress).slot0();
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


    function _returnedAmount(
        SwapState memory _state,
        int256 _amountSpecified,
        bool _zeroForOne
    ) internal pure returns (int256 amount0, int256 amount1) {
        if (_amountSpecified > 0) {
            (amount0, amount1) = _zeroForOne
                ? (_amountSpecified - _state.amountSpecifiedRemaining, _state.amountCalculated)
                : (_state.amountCalculated, _amountSpecified - _state.amountSpecifiedRemaining);
        } else {
            (amount0, amount1) = _zeroForOne
                ? (_state.amountCalculated, _amountSpecified - _state.amountSpecifiedRemaining)
                : (_amountSpecified - _state.amountSpecifiedRemaining, _state.amountCalculated);
        }
    }

}
