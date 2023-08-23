// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// https://arbiscan.io/address/0xba12222222228d8ba445958a75a0704d566bf2c8

interface IVault {
  function getPool(bytes32 poolId) external view returns (address addr, uint8 something);
  function getPoolTokenInfo(bytes32 poolId, address token) external view returns (uint256 cash, uint256 managed, uint256 lastChangeBlock, address assetManager);
  function getPoolTokens(bytes32 poolId) external view returns (address[] memory tokens, uint256[] memory balances, uint256 lastChangeBlock);
}
