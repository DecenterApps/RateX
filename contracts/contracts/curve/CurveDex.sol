// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IDex} from '../rateX/interfaces/IDex.sol';
import {ICurvePool} from './interfaces/ICurvePool.sol';
import {ICurvePoolRegistry} from './interfaces/ICurvePoolRegistry.sol';
import {IFactoryCurvePoolRegistry} from './interfaces/IFactoryCurvePoolRegistry.sol';
import {IFactoryCurvePoolRegistryNonStable} from './interfaces/IFactoryCurvePoolRegistryNonStable.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

/// @title CurveDex - A DEX implementation for Curve
/// @notice This contract implements the IDex interface for Curve protocol
/// @dev This contract interacts with Curve pools to perform token swaps
contract CurveDex is IDex {
  ICurvePoolRegistry private immutable curvePoolRegistry;
  IFactoryCurvePoolRegistry private immutable factoryCurvePoolRegistry;
  IFactoryCurvePoolRegistryNonStable private immutable factoryCurvePoolRegistryNonStable;

  constructor(address _curvePoolRegistry, address _factoryCurvePoolRegistry, address _factoryCurvePoolRegistryNonStable) {
    curvePoolRegistry = ICurvePoolRegistry(_curvePoolRegistry);
    factoryCurvePoolRegistry = IFactoryCurvePoolRegistry(_factoryCurvePoolRegistry);
    factoryCurvePoolRegistryNonStable = IFactoryCurvePoolRegistryNonStable(_factoryCurvePoolRegistryNonStable);
  }

  /// @notice Swaps tokens using the Curve protocol
  /// @dev This function decodes the swap parameters from _data and performs the swap
  /// @param _data Encoded data containing the addresses of pool, tokenIn, and tokenOut
  /// @param _amountIn The amount of input tokens to swap
  /// @param _amountOutMin The minimum amount of output tokens expected
  /// @param _to The address that will receive the output tokens
  /// @return amountOut The amount of output tokens received from the swap
  function swap(
    bytes calldata _data,
    uint256 _amountIn,
    uint256 _amountOutMin,
    address _to,
    uint256 /*_deadline*/
  ) external override returns (uint256 amountOut) {
    (address poolAddress, address tokenIn, address tokenOut) = abi.decode(_data, (address, address, address));

    TransferHelper.safeApprove(tokenIn, poolAddress, _amountIn);

    (int128 i, int128 j) = findTokenIndexes(poolAddress, tokenIn, tokenOut);
    require(i >= 0 && j >= 0, 'Tokens not found in pool');

    amountOut = ICurvePool(poolAddress).exchange(i, j, _amountIn, _amountOutMin, _to);
  }

  /// @notice Finds the indexes of tokenIn and tokenOut in the given Curve pool
  /// @dev This function handles both regular and factory Curve pools
  /// @param _poolAddress The address of the Curve pool
  /// @param _tokenIn The address of the input token
  /// @param _tokenOut The address of the output token
  /// @return i The index of the input token in the pool
  /// @return j The index of the output token in the pool
  function findTokenIndexes(address _poolAddress, address _tokenIn, address _tokenOut) internal view returns (int128 i, int128 j) {
    address[8] memory coins = curvePoolRegistry.get_coins(_poolAddress);
    address[] memory coinsFactory = factoryCurvePoolRegistry.get_coins(_poolAddress);
    address[4] memory coinsFactoryNonStable = factoryCurvePoolRegistryNonStable.get_coins(_poolAddress);
    if (coins[0] != 0x0000000000000000000000000000000000000000) {
      // main
      i = -1;
      j = -1;

      for (uint256 k = 0; k < 8; k++) {
        if (coins[k] == _tokenIn) {
          i = int128(int256(k));
        }
        if (coins[k] == _tokenOut) {
          j = int128(int256(k));
        }
      }
    } else if (coinsFactory.length>0 && coinsFactory[0] != 0x0000000000000000000000000000000000000000) {
      // factory-stable-ng
      i = -1;
      j = -1;

      for (uint256 k = 0; k < coinsFactory.length; k++) {
        if (coinsFactory[k] == _tokenIn) {
          i = int128(int256(k));
        }
        if (coinsFactory[k] == _tokenOut) {
          j = int128(int256(k));
        }
      }
    } else if (coinsFactoryNonStable[0] != 0x0000000000000000000000000000000000000000) {
      // factory
      i = -1;
      j = -1;

      for (uint256 k = 0; k < 4; k++) {
        if (coinsFactoryNonStable[k] == _tokenIn) {
          i = int128(int256(k));
        }
        if (coinsFactoryNonStable[k] == _tokenOut) {
          j = int128(int256(k));
        }
      }
    }
  }
}
