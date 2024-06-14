// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../rateX/interfaces/IDex.sol';
import './interfaces/ICurvePool.sol';
import './interfaces/ICurvePoolRegistry.sol';
import './interfaces/IFactoryCurvePoolRegistry.sol';
import '../rateX/libraries/TransferHelper.sol';

contract CurveDex is IDex {
  ICurvePoolRegistry private immutable curvePoolRegistry;
  IFactoryCurvePoolRegistry private immutable curveFactoryPoolRegistry;

  constructor(address _curvePoolRegistry, address _curveFactoryPoolRegistry) {
    curvePoolRegistry = ICurvePoolRegistry(_curvePoolRegistry);
    curveFactoryPoolRegistry = IFactoryCurvePoolRegistry(_curveFactoryPoolRegistry);
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
    if (
      _poolAddress == 0x7f90122BF0700F9E7e1F688fe926940E8839F353 ||
      _poolAddress == 0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb ||
      _poolAddress == 0x30dF229cefa463e991e29D42DB0bae2e122B2AC7 ||
      _poolAddress == 0xC9B8a3FDECB9D5b218d02555a8Baf332E5B740d5 ||
      _poolAddress == 0x6eB2dc694eB516B16Dc9FBc678C60052BbdD7d80 ||
      _poolAddress == 0x960ea3e3C7FB317332d990873d354E18d7645590
    ) {
      address[8] memory coins = curvePoolRegistry.get_coins(_poolAddress);
      i = -1;
      j = -1;

      for (uint256 k = 0; k < 2; k++) {
        if (coins[k] == _tokenIn) {
          i = int128(int256(k));
        }
        if (coins[k] == _tokenOut) {
          j = int128(int256(k));
        }
      }
    } else {
      address[] memory coins = curveFactoryPoolRegistry.get_coins(_poolAddress);
      i = -1;
      j = -1;

      for (uint256 k = 0; k < 2; k++) {
        if (coins[k] == _tokenIn) {
          i = int128(int256(k));
        }
        if (coins[k] == _tokenOut) {
          j = int128(int256(k));
        }
      }
    }
  }
}
