// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ISushiSwapRouter} from './interfaces/ISushiSwapRouter.sol';
import {IDex} from '../rateX/interfaces/IDex.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

/// @title SushiSwapDex - A DEX implementation for SushiSwap
/// @notice This contract implements the IDex interface for SushiSwap protocol
/// @dev This contract interacts with SushiSwap's router to perform token swaps
contract SushiSwapDex is IDex {
  ISushiSwapRouter private immutable sushiRouter;

  constructor(address _sushiSwapRouter) {
    sushiRouter = ISushiSwapRouter(_sushiSwapRouter);
  }

  /// @notice Swaps tokens using the SushiSwap protocol
  /// @dev This function decodes the swap parameters from _data and performs the swap
  /// @param _data Encoded data containing the addresses of tokenIn and tokenOut
  /// @param _amountIn The amount of input tokens to swap
  /// @param _amountOutMin The minimum amount of output tokens expected
  /// @param _to The address that will receive the output tokens
  /// @param _deadline The timestamp by which the transaction must be executed
  /// @return The amount of output tokens received from the swap
  function swap(bytes calldata _data, uint256 _amountIn, uint256 _amountOutMin, address _to, uint256 _deadline) external override returns (uint256) {
    (address tokenIn, address tokenOut) = abi.decode(_data, (address, address));

    TransferHelper.safeApprove(tokenIn, address(sushiRouter), _amountIn);

    address[] memory path = new address[](2);
    path[0] = tokenIn;
    path[1] = tokenOut;

    uint256[] memory amounts = sushiRouter.swapExactTokensForTokens(_amountIn, _amountOutMin, path, _to, _deadline);

    return amounts[1];
  }
}
