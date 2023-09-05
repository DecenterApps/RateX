// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/ICamelotPair.sol';
import './interfaces/ICamelotRouter.sol';
import "../rateX/interfaces/IDex.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

contract CamelotDex is IDex {
    ICamelotRouter private immutable camelotRouter;

    constructor(address _routerAddress) {
        camelotRouter = ICamelotRouter(_routerAddress);
    }

    function swap(
        address _poolAddress,
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    ) external returns(uint256 amountOut) {

        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).approve(address(camelotRouter), _amountIn);

        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        amountOut = camelotRouter.getAmountsOut(_amountIn, path)[1];

        camelotRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            _amountIn, 
            _amountOutMin, 
            path, 
            _to,
            msg.sender,
            block.timestamp
        );
    }
}