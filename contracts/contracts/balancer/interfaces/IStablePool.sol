// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// COPIED FROM WEIGHTED
// EXAMPLE POOL (wstETH - wETH)
// https://arbiscan.io/address/0x36bf227d6BaC96e2aB1EbB5492ECec69C691943f#readContract

interface IStablePool {
    function decimals() external view returns (uint8 decimals);
    function getInvariant() external view returns (uint256 invariant);
    function getPoolId() external view returns (bytes32 poolId);
    function getAmplificationParameter() external view returns (uint256 value, bool isUpdating, uint256 precision);
    function getSwapFeePercentage() external view returns (uint256 swapFee);
}