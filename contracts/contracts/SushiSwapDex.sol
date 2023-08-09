// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDex.sol";
import "./interfaces/sushiV2/ISushiSwapRouter.sol";
import "./interfaces/sushiV2/ISushiSwapV2Factory.sol";
import "./interfaces/sushiV2/ISushiSwapV2Pair.sol";
import "./interfaces/IERC20.sol";
import "./SushiSwapV2Library.sol";

contract SushiSwapDex is IDex {

    ISushiSwapRouter private sushiRouter;
    ISushiSwapV2Factory private sushiFactory;

    constructor(address _sushiSwapRouter, address _sushiSwapFactory){
        sushiRouter = ISushiSwapRouter(_sushiSwapRouter);
        sushiFactory = ISushiSwapV2Factory(_sushiSwapFactory);
    }

    function swap(
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

    function quote(address _tokenIn, address _tokenOut, uint _amountIn) external view override returns(uint amountOut){
        address pairAddress = sushiFactory.getPair(_tokenIn, _tokenOut);
        amountOut = SushiSwapV2Library.quote(pairAddress, _tokenIn, _tokenOut, _amountIn);
    }

    function quoteV2(address _poolAddress, address _tokenIn, address _tokenOut, uint _amountIn)
        external
        returns(uint reserveIn, uint reserveOut, uint amountOut)
    {
        return SushiSwapV2Library.quoteV2(_poolAddress, _tokenIn, _tokenOut, _amountIn);
    }
}
