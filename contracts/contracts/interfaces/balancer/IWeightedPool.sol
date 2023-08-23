// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// EXAMPLE POOL (RDNT - WETH)
// https://arbiscan.io/address/0x32dF62dc3aEd2cD6224193052Ce665DC18165841

interface IWeightedPool {
    function decimals() external view returns (uint8 decimals);
    function getInvariant() external view returns (uint256 invariant);
    function getPoolId() external view returns (bytes32 poolId);
    function getNormalizedWeights() external view returns (uint256[] memory weights);
}