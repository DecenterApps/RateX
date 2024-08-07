// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IDex {
    /// @notice Swap tokenIn for tokenOut on single dex
    /// @param _data The data for the swap
    /// @param _amountOutMin The minimum acceptable amount of tokenOut
    /// @param _to The recipient address of the swap
    /// @param _deadline The deadline for the swap
    /// @return amountOut The amount of tokenOut received
    function swap( 
        bytes calldata _data,
        uint _amountIn,
        uint _amountOutMin,
        address _to,
        uint _deadline
    ) external returns(uint256 amountOut);
}
