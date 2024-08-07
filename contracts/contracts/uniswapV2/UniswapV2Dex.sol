// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IUniswapV2Router} from './interfaces/IUniswapV2Router.sol';
import {IDex} from '../rateX/interfaces/IDex.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

contract UniswapV2Dex is IDex {
  IUniswapV2Router public immutable router;

  constructor(address routerAddress) {
    router = IUniswapV2Router(routerAddress);
  }

  function swap(bytes calldata _data, uint _amountIn, uint _amountOutMin, address _to, uint _deadline) external override returns (uint256) {
    (address _tokenIn, address _tokenOut) = abi.decode(_data, (address, address));
    
    TransferHelper.safeApprove(_tokenIn, address(router), _amountIn);

    address[] memory path = new address[](2);
    path[0] = _tokenIn;
    path[1] = _tokenOut;

    uint256[] memory amounts = router.swapExactTokensForTokens(_amountIn, _amountOutMin, path, _to, _deadline);

    emit TestAmountOutEvent(amounts[1]);

    return amounts[1];
  }
}
