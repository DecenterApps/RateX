// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/ICurveStableSwap.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IDex.sol";

import "hardhat/console.sol";

contract CurveSwapDex is IDex {

    ICurveStableSwap private curveStableSwap;

    mapping (address => int128) public tokenToIndex;

    // 2Pool as example
    constructor(
        address _curveStableSwapAddress,
        address _usdcToken,
        address _usdtToken
    ){
        curveStableSwap = ICurveStableSwap(_curveStableSwapAddress);
        tokenToIndex[_usdcToken] = 0;
        tokenToIndex[_usdtToken] = 1;
    }

    function swap(
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    )
    public
    {
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).approve(address(curveStableSwap), _amountIn);

        int128 i = tokenToIndex[_tokenIn];
        int128 j = tokenToIndex[_tokenOut];

        curveStableSwap.exchange(i, j, _amountIn, _amountOutMin, _to);
    }
}
