// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDex {

    function swap(
        address _poolAddress,
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    ) external returns(uint amountOut);
}
