// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IUniswapV3Pool} from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import {ISwapRouter} from '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import {IDex} from '../rateX/interfaces/IDex.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

/// @title UniswapV3Dex - A DEX implementation for Uniswap V3
/// @notice This contract implements the IDex interface for Uniswap V3 protocol
/// @dev This contract interacts with Uniswap V3's swap router to perform token swaps
contract UniswapV3Dex is IDex {
  ISwapRouter public immutable swapRouter;

  constructor(address _swapRouterAddress) {
    swapRouter = ISwapRouter(_swapRouterAddress);
  }

  /// @notice Swaps tokens using the Uniswap V3 protocol
  /// @dev This function decodes the swap parameters from _data and performs the swap
  /// @param _data Encoded data containing the pool address, tokenIn, and tokenOut addresses
  /// @param _amountIn The amount of input tokens to swap
  /// @param _amountOutMin The minimum amount of output tokens expected
  /// @param _to The address that will receive the output tokens
  /// @param _deadline The timestamp by which the transaction must be executed
  /// @return amountOut The amount of output tokens received from the swap
  function swap(
    bytes calldata _data,
    uint _amountIn,
    uint _amountOutMin,
    address _to,
    uint _deadline
  ) external returns (uint256 amountOut) {
    (address _poolAddress, address _tokenIn, address _tokenOut) = abi.decode(_data, (address, address, address));

    TransferHelper.safeApprove(_tokenIn, address(swapRouter), _amountIn);

    amountOut = swapRouter.exactInputSingle(
      ISwapRouter.ExactInputSingleParams({
        tokenIn: _tokenIn,
        tokenOut: _tokenOut,
        fee: IUniswapV3Pool(_poolAddress).fee(),
        recipient: _to,
        deadline: _deadline,
        amountIn: _amountIn,
        amountOutMinimum: _amountOutMin,
        sqrtPriceLimitX96: 0
      })
    );
  }
}
