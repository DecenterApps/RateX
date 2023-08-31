// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

// Example pool
// https://arbiscan.io/address/0xc873fEcbd354f5A56E00E710B90EF4201db2448d#writeContract

interface ICamelotRouter {
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        address refferer,
        uint256 deadline
    ) external;

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);
}