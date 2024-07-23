// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// https://arbiscan.io/address/0xba12222222228d8ba445958a75a0704d566bf2c8

interface IVault {
  enum SwapKind { GIVEN_IN, GIVEN_OUT }

  struct SingleSwap {
    bytes32 poolId;
    SwapKind kind;
    address assetIn;
    address assetOut;
    uint256 amount;
    bytes userData;
  }

  struct FundManagement {
    address sender;
    bool fromInternalBalance;
    address payable recipient;
    bool toInternalBalance;
  }

  function setRelayerApproval(address relayer, address spender, bool approved) external;

  function getPool(bytes32 poolId) external view returns (address addr, uint8 something);
  function getPoolTokenInfo(bytes32 poolId, address token) external view returns (uint256 cash, uint256 managed, uint256 lastChangeBlock, address assetManager);
  function getPoolTokens(bytes32 poolId) external view returns (address[] memory tokens, uint256[] memory balances, uint256 lastChangeBlock);

  function swap(
    SingleSwap memory singleSwap,
    FundManagement memory funds,
    uint256 limit,
    uint256 deadline
  ) external payable returns (uint256);
}
