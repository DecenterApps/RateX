// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IDex {

    /// @notice Event emitted when a swap occurs
    /// @dev This event is useful when we test swapping with one dex in isolation
    /// later for production we don't need this as it will waste additional gas
    event TestAmountOutEvent(uint256 amountOut);

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
