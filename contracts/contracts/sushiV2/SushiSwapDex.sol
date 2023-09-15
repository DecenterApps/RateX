// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/ISushiSwapRouter.sol";
import "../rateX/interfaces/IDex.sol";
import "../rateX/libraries/TransferHelper.sol";

contract SushiSwapDex is IDex {

    ISushiSwapRouter private immutable sushiRouter;

    constructor(address _sushiSwapRouter){
        sushiRouter = ISushiSwapRouter(_sushiSwapRouter);
    }

    function swap(
        address _poolAddress,
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    )
    external override returns(uint256)
    {
        TransferHelper.safeTransferFrom(_tokenIn, msg.sender, address(this), _amountIn);
        TransferHelper.safeApprove(_tokenIn, address(sushiRouter), _amountIn);

        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        uint256[] memory amounts = sushiRouter.swapExactTokensForTokens(
            _amountIn,
            _amountOutMin,
            path,
            _to,
            block.timestamp
        );

        emit TestAmountOutEvent(amounts[1]);

        return amounts[1];
    }
}
