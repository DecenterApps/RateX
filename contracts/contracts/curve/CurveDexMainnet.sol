// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../rateX/interfaces/IDex.sol';
import './interfaces/ICurvePool.sol';
import './interfaces/ICurvePoolRegistry.sol';
import './interfaces/IFactoryCurvePoolRegistry.sol';
import './interfaces/IFactoryCurvePoolRegistryNonStable.sol';
import '../rateX/libraries/TransferHelper.sol';

contract CurveDexMainnet is IDex {
  ICurvePoolRegistry private immutable curvePoolRegistry;
  IFactoryCurvePoolRegistry private immutable factoryCurvePoolRegistry;
  IFactoryCurvePoolRegistryNonStable private immutable factoryCurvePoolRegistryNonStable;

  constructor(address _curvePoolRegistry, address _factoryCurvePoolRegistry, address _factoryCurvePoolRegistryNonStable) {
    curvePoolRegistry = ICurvePoolRegistry(_curvePoolRegistry);
    factoryCurvePoolRegistry = IFactoryCurvePoolRegistry(_factoryCurvePoolRegistry);
    factoryCurvePoolRegistryNonStable = IFactoryCurvePoolRegistryNonStable(_factoryCurvePoolRegistryNonStable);
  }

  function swap(
    address _poolAddress,
    address _tokenIn,
    address _tokenOut,
    uint _amountIn,
    uint _amountOutMin,
    address _to
  ) external override returns (uint256 amountOut) {
    TransferHelper.safeTransferFrom(_tokenIn, msg.sender, address(this), _amountIn);
    TransferHelper.safeApprove(_tokenIn, _poolAddress, _amountIn);

    (int128 i, int128 j) = findTokenIndexes(_poolAddress, _tokenIn, _tokenOut);
    require(i >= 0 && j >= 0, 'Tokens not found in pool');

    amountOut = ICurvePool(_poolAddress).exchange(i, j, _amountIn, _amountOutMin, _to);

    emit TestAmountOutEvent(amountOut);
  }

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
