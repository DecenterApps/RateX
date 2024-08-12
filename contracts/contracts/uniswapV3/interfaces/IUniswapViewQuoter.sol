// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

interface IUniswapViewQuoter {
    function estimateAmountOut(
        address _pool,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) external view returns (uint256);
}
