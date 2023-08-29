// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

// Example pool
// https://arbiscan.io/address/0xa6c5c7d189fa4eb5af8ba34e63dcdd3a635d433f#code

interface ICamelotPair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint16 token0feePercent, uint16 token1FeePercent);
    function getAmountOut(uint amountIn, address tokenIn) external view returns (uint);
}