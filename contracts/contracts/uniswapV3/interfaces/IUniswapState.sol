// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUniswapState {

    // the top level state of the swap, the results of which are recorded in storage at the end
    struct SwapState {
        // the amount remaining to be swapped in/out of the input/output asset
        int256 amountSpecifiedRemaining;
        // the amount already swapped out/in of the output/input asset
        int256 amountCalculated;
        // current sqrt(price)
        uint160 sqrtPriceX96;
        // the tick associated with the current price
        int24 tick;
        // the current liquidity in range
        uint128 liquidity;
    }

    struct StepComputations {
        // the price at the beginning of the step
        uint160 sqrtPriceStartX96;
        // the next tick to swap to from the current tick in the swap direction
        int24 tickNext;
        // whether tickNext is initialized or not
        bool initialized;
        // sqrt(price) for the next tick (1/0)
        uint160 sqrtPriceNextX96;
        // how much is being swapped in in this step
        uint256 amountIn;
        // how much is being swapped out
        uint256 amountOut;
        // how much fee is being paid in
        uint256 feeAmount;
    }

    struct PoolInfo {
        address pool;
        address token0;
        address token1;
        int24 tick;
        int128 tickLiquidityNet;
        int24 tickSpacing;
        uint24 fee;
        uint160 sqrtPriceX96;
        uint128 liquidity;
    }

    struct TickData {
        int24 tick;
        bool initialized;
        int128 liquidityNet;
    }

    struct PoolData {
        PoolInfo info;
        TickData[] zeroForOneTicks;
        TickData[] oneForZeroTicks;
    }
}
