// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/ISushiSwapRouter.sol";
import "./interfaces/ISushiSwapV2Factory.sol";
import "./SushiSwapV2Library.sol";
import "../rateX/interfaces/IDex.sol";
import "../rateX/interfaces/IERC20.sol";

contract SushiSwapDex is IDex {

    ISushiSwapRouter private sushiRouter;

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
    external override returns(uint)
    {
        // remove approval in separate contract later
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).approve(address(sushiRouter), _amountIn);

        address[] memory path;
        path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        uint[] memory amounts = sushiRouter.swapExactTokensForTokens(
            _amountIn,
            _amountOutMin,
            path,
            _to,
            block.timestamp
        );

        return amounts[1];
    }
}