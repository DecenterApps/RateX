// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ICamelotRouter} from './interfaces/ICamelotRouter.sol';
import {IDex} from '../rateX/interfaces/IDex.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

/// @title CamelotDex - A DEX implementation for Camelot
/// @notice This contract implements the IDex interface for Camelot DEX
/// @dev This contract interacts with Camelot's router to perform token swaps
contract CamelotDex is IDex {
  ICamelotRouter private immutable camelotRouter;

  constructor(address _routerAddress) {
    camelotRouter = ICamelotRouter(_routerAddress);
  }

  /// @notice Swaps tokens using the Camelot DEX
  /// @dev This function decodes the swap path from _data and performs the swap
  /// @param _data Encoded data containing the addresses of tokenIn and tokenOut
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
  ) external returns (uint256 amountOut) {
    (address tokenIn, address tokenOut) = abi.decode(_data, (address, address));

    TransferHelper.safeApprove(tokenIn, address(camelotRouter), _amountIn);

    address[] memory path = new address[](2);
    path[0] = tokenIn;
    path[1] = tokenOut;

    amountOut = camelotRouter.getAmountsOut(_amountIn, path)[1];

    camelotRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(_amountIn, _amountOutMin, path, _to, address(this), _deadline);
  }
}
