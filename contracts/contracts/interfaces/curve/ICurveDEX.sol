// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurveStableSwapDEX {
    // function get_base_pool(address poolAddress) external view returns (address base_pool);
    function decimals() external view returns (uint256 decimals);
    function A() external view returns (uint256 A);
    function fee() external view returns (uint256 poolFee);
    function get_dy(int128 i, int128 j, uint256 dx) external view returns (uint256 dy);
    function coins(uint256 arg0) external view returns (address tokenAddress);
    function balances(uint256 arg0) external view returns (uint256 balance);
}
