// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IUniswapV3Pool} from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import {ISwapRouter} from '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import {IDex} from '../rateX/interfaces/IDex.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

contract UniswapV3Dex is IDex {
  ISwapRouter public immutable swapRouter;

  constructor(address _swapRouterAddress) {
    swapRouter = ISwapRouter(_swapRouterAddress);
  }

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

    emit TestAmountOutEvent(amountOut);
  }
}
