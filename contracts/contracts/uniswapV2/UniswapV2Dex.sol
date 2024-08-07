// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IUniswapV2Router} from './interfaces/IUniswapV2Router.sol';
import {IDex} from '../rateX/interfaces/IDex.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

/// @title UniswapV2Dex - A DEX implementation for Uniswap V2
/// @notice This contract implements the IDex interface for Uniswap V2 protocol
/// @dev This contract interacts with Uniswap V2's router to perform token swaps
contract UniswapV2Dex is IDex {
  IUniswapV2Router public immutable router;

  constructor(address routerAddress) {
    router = IUniswapV2Router(routerAddress);
  }

  /// @notice Swaps tokens using the Uniswap V2 protocol
  /// @dev This function decodes the swap parameters from _data and performs the swap
  /// @param _data Encoded data containing the addresses of tokenIn and tokenOut
  /// @param _amountIn The amount of input tokens to swap
  /// @param _amountOutMin The minimum amount of output tokens expected
  /// @param _to The address that will receive the output tokens
  /// @param _deadline The timestamp by which the transaction must be executed
  /// @return The amount of output tokens received from the swap
  function swap(bytes calldata _data, uint _amountIn, uint _amountOutMin, address _to, uint _deadline) external override returns (uint256) {
    (address _tokenIn, address _tokenOut) = abi.decode(_data, (address, address));
    
    TransferHelper.safeApprove(_tokenIn, address(router), _amountIn);

    address[] memory path = new address[](2);
    path[0] = _tokenIn;
    path[1] = _tokenOut;

    uint256[] memory amounts = router.swapExactTokensForTokens(_amountIn, _amountOutMin, path, _to, _deadline);

    return amounts[1];
  }
}
