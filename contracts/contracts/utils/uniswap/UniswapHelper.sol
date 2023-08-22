// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolImmutables.sol";

import {TickBitmap} from "./libraries/TickBitmap.sol";
import {TickMath} from "./libraries/TickMath.sol";
import {LowGasSafeMath} from "./libraries/LowGasSafeMath.sol";
import {LiquidityMath} from "./libraries/LiquidityMath.sol";
import {SwapMath} from "./libraries/SwapMath.sol";
import {SafeCast} from "./libraries/SafeCast.sol";

import "hardhat/console.sol";
import "./interfaces/IUniswapHelper.sol";

contract UniswapHelper is IUniswapHelper {

    using LowGasSafeMath for uint256;
    using LowGasSafeMath for int256;
    using SafeCast for uint256;
    using SafeCast for int256;

    function fetchData(address[] calldata _pools, uint256 _numOfTicks)
    external view override returns (PoolData[] memory poolData)
    {
        poolData = new PoolData[](_pools.length);
        for (uint256 i = 0; i < _pools.length; i++) {
            poolData[i] = _fetchPoolData(_pools[i], _numOfTicks);
        }
    }

    function fetchPoolData(address _pool, uint256 _numOfTicks)
    external view override returns (PoolData memory)
    {
        return _fetchPoolData(_pool, _numOfTicks);
    }

    function _fetchPoolData(address _pool, uint256 _numOfTicks)
    internal view returns (PoolData memory)
    {
        IUniswapV3Pool pool = IUniswapV3Pool(_pool);
        IUniswapV3PoolImmutables immutables = IUniswapV3PoolImmutables(_pool);
        (uint160 sqrtPriceX96,int24 tick, , , , ,) = pool.slot0();

        PoolInfo memory info = PoolInfo({
            pool: _pool,
            token0: immutables.token0(),
            token1: immutables.token1(),
            tick: tick,
            tickSpacing: immutables.tickSpacing(),
            fee: immutables.fee(),
            sqrtPriceX96: sqrtPriceX96,
            liquidity: pool.liquidity()
        });

        return PoolData({
            info: info,
            zeroForOneTicks: _fetchTicks(info, _numOfTicks, true),
            oneForZeroTicks: _fetchTicks(info, _numOfTicks, false)
        });
    }

    function _fetchTicks(PoolInfo memory _info, uint256 _numOfTicks, bool _zeroForOne)
    internal view returns (TickData[] memory)
    {
        TickData[] memory ticks = new TickData[](_numOfTicks);
        int24 tick = _info.tick;
        int128 liquidityNet;
        bool initialized;
        for (uint256 i = 0; i < _numOfTicks; ++i) {
            (tick, initialized) = TickBitmap.nextInitializedTickWithinOneWord(_info.pool, tick, _info.tickSpacing, _zeroForOne);

            if (initialized) {
                (, liquidityNet,,,,,,) = IUniswapV3Pool(_info.pool).ticks(tick);
            } else {
                liquidityNet = 0;
            }

            ticks[i] = TickData({
                tick: tick,
                initialized: initialized,
                liquidityNet: liquidityNet
            });

            if (_zeroForOne) tick -= 1;
        }
        return ticks;
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



    ////// HELPERS FOR TESTING ///////////////////////

    // test method
    function quote(
        address _poolAddress,
        address _tokenIn,
        address _tokenOut,
        int256 _amountIn,
        uint256 _numOfTicks
    )
    public view returns (uint256 amountOut, uint256 amountRemaining)
    {
        PoolData memory poolData = _fetchPoolData(_poolAddress, _numOfTicks);

        bool zeroForOne = _tokenIn < _tokenOut;
        uint160 sqrtPriceLimitX96 = zeroForOne ? (TickMath.MIN_SQRT_RATIO + 1) : (TickMath.MAX_SQRT_RATIO - 1);

        return offchainQuote(poolData, _amountIn, sqrtPriceLimitX96, zeroForOne);
    }

    // test method
    // offchain -> because SDK will contain same logic as this function
    // We will first get the data and then calculate the quote
    function offchainQuote(
        PoolData memory _poolData,
        int256 _amountIn,
        uint160 _sqrtPriceLimitX96,
        bool _zeroForOne
    )
    public view returns (uint256 amountOut, uint256 amountRemaining)
    {
        require(_amountIn > 0, "Amount specified must be greater than 0");

        TickData[] memory ticksData = _zeroForOne ? _poolData.zeroForOneTicks : _poolData.oneForZeroTicks;

        SwapState memory state = SwapState({
            amountSpecifiedRemaining: _amountIn,
            amountCalculated: 0,
            sqrtPriceX96: _poolData.info.sqrtPriceX96,
            tick: _poolData.info.tick,
            liquidity: _poolData.info.liquidity
        });
        console.log("Amount at the beggining: ", uint256(_amountIn));

        uint256 tickDataIndex = 0;

        while (
            state.amountSpecifiedRemaining != 0 &&
            state.sqrtPriceX96 != _sqrtPriceLimitX96 &&
            tickDataIndex < ticksData.length
        ) {
            TickData memory tickData = ticksData[tickDataIndex];

            StepComputations memory step;
            step.sqrtPriceStartX96 = state.sqrtPriceX96;
            step.tickNext = tickData.tick;
            step.initialized = tickData.initialized;
            step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(tickData.tick);

            (state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount) = SwapMath.computeSwapStep(
                state.sqrtPriceX96,
                (_zeroForOne ? step.sqrtPriceNextX96 < _sqrtPriceLimitX96 : step.sqrtPriceNextX96 > _sqrtPriceLimitX96)
                    ? _sqrtPriceLimitX96
                    : step.sqrtPriceNextX96,
                state.liquidity,
                state.amountSpecifiedRemaining,
                _poolData.info.fee
            );

            state.amountSpecifiedRemaining -= (step.amountIn + step.feeAmount).toInt256();
            state.amountCalculated = state.amountCalculated.sub(step.amountOut.toInt256());

            if (state.sqrtPriceX96 == step.sqrtPriceNextX96) {
                // if the tick is initialized, run the tick transition
                if (step.initialized) {
                    int128 liquidityNet = tickData.liquidityNet;
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

            console.log("QQ Step initialized :", step.initialized);
            console.log("QQ Using Tick: ", uint256(int256(tickData.tick)));
            console.log("QQ Liquidity net: ", uint256(int256(tickData.liquidityNet)));
            console.log("QQ Sqrt price next:", uint256(step.sqrtPriceNextX96));
            console.log("QQ Sqrt price:", uint256(state.sqrtPriceX96));

            tickDataIndex++;
        }
        amountRemaining = uint256(state.amountSpecifiedRemaining);
        amountOut = state.amountCalculated > 0 ? uint256(state.amountCalculated) : uint256(- state.amountCalculated);
    }
}
