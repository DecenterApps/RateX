// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ICamelotRouter} from './interfaces/ICamelotRouter.sol';
import {IDex} from '../rateX/interfaces/IDex.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

contract CamelotDex is IDex {
  ICamelotRouter private immutable camelotRouter;

  constructor(address _routerAddress) {
    camelotRouter = ICamelotRouter(_routerAddress);
  }

  function swap(
    address /*_poolAddress*/,
    address _tokenIn,
    address _tokenOut,
    uint _amountIn,
    uint _amountOutMin,
    address _to,
    uint _deadline
  ) external returns (uint256 amountOut) {
    TransferHelper.safeApprove(_tokenIn, address(camelotRouter), _amountIn);

    address[] memory path = new address[](2);
    path[0] = _tokenIn;
    path[1] = _tokenOut;

    amountOut = camelotRouter.getAmountsOut(_amountIn, path)[1];

    camelotRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(_amountIn, _amountOutMin, path, _to, address(this), _deadline);

    emit TestAmountOutEvent(amountOut);
  }
}
