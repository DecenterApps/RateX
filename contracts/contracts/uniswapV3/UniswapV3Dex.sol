// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "../rateX/interfaces/IDex.sol";
import "../rateX/libraries/TransferHelper.sol";

contract UniswapV3Dex is IDex {

    ISwapRouter public immutable swapRouter;

    constructor(address _swapRouterAddress) {
        swapRouter = ISwapRouter(_swapRouterAddress);
    }

    function swap(
        address _poolAddress,
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    ) external returns(uint256 amountOut) {

        TransferHelper.safeTransferFrom(_tokenIn, msg.sender, address(this), _amountIn);
        TransferHelper.safeApprove(_tokenIn, address(swapRouter), _amountIn);

        amountOut = swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _tokenIn,
                tokenOut: _tokenOut,
                fee: IUniswapV3Pool(_poolAddress).fee(),
                recipient: _to,
                deadline: block.timestamp,
                amountIn: _amountIn,
                amountOutMinimum: _amountOutMin,
                sqrtPriceLimitX96: 0
            })
        );

        emit TestAmountOutEvent(amountOut);
    }
}
