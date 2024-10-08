// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IDex} from '../rateX/interfaces/IDex.sol';
import {IVault} from './interfaces/IVault.sol';
import {IWeightedPool} from './interfaces/IWeightedPool.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

/// @title BalancerDex - A DEX implementation for Balancer
/// @notice This contract implements the IDex interface for Balancer protocol
/// @dev This contract interacts with Balancer's Vault to perform token swaps
contract BalancerDex is IDex {
  enum PoolType {
    Weighted,
    Stable,
    Linear
  }

  IVault private immutable balancerVault;

  constructor(address _balancerVault) {
    balancerVault = IVault(_balancerVault);
  }

  /// @notice Swaps tokens using the Balancer protocol
  /// @dev This function decodes the swap parameters from _data and performs the swap
  /// @param _data Encoded data containing the addresses of pool, tokenIn, and tokenOut
  /// @param _amountIn The amount of input tokens to swap
  /// @param _amountOutMin The minimum amount of output tokens expected
  /// @param _to The address that will receive the output tokens
  /// @param _deadline The timestamp by which the transaction must be executed
  /// @return amountOut The amount of output tokens received from the swap
  function swap(
    bytes calldata _data,
    uint256 _amountIn,
    uint256 _amountOutMin,
    address _to,
    uint256 _deadline
  ) external override returns (uint256 amountOut) {
    (address poolAddress, address tokenIn, address tokenOut) = abi.decode(_data, (address, address, address));

    TransferHelper.safeApprove(tokenIn, address(balancerVault), _amountIn);

    IWeightedPool pool = IWeightedPool(poolAddress);
    bytes32 poolId = pool.getPoolId();

    IVault.SingleSwap memory singleSwap;
    singleSwap.poolId = poolId;
    singleSwap.kind = IVault.SwapKind.GIVEN_IN;
    singleSwap.assetIn = tokenIn;
    singleSwap.assetOut = tokenOut;
    singleSwap.amount = _amountIn;

    IVault.FundManagement memory fundManagement;
    fundManagement.sender = address(this);
    fundManagement.fromInternalBalance = false;
    fundManagement.recipient = payable(_to);
    fundManagement.toInternalBalance = false;

    amountOut = balancerVault.swap(singleSwap, fundManagement, _amountOutMin, _deadline);
  }
}
