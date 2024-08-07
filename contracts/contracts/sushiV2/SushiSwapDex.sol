// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ISushiSwapRouter} from './interfaces/ISushiSwapRouter.sol';
import {IDex} from '../rateX/interfaces/IDex.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

contract SushiSwapDex is IDex {
  ISushiSwapRouter private immutable sushiRouter;

  constructor(address _sushiSwapRouter) {
    sushiRouter = ISushiSwapRouter(_sushiSwapRouter);
  }

  function swap(bytes calldata _data, uint _amountIn, uint _amountOutMin, address _to, uint _deadline) external override returns (uint256) {
    (address _tokenIn, address _tokenOut) = abi.decode(_data, (address, address));
    
    TransferHelper.safeApprove(_tokenIn, address(sushiRouter), _amountIn);

    address[] memory path = new address[](2);
    path[0] = _tokenIn;
    path[1] = _tokenOut;

    uint256[] memory amounts = sushiRouter.swapExactTokensForTokens(_amountIn, _amountOutMin, path, _to, _deadline);

    emit TestAmountOutEvent(amounts[1]);

    return amounts[1];
  }
}
