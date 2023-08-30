// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurvePool {
    function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy, address to) external returns(uint256);
    function A() external view returns (uint256 A);
    function fee() external view returns (uint256 poolFee);
    function balances(uint256 arg0) external view returns (uint256 balance);
}
