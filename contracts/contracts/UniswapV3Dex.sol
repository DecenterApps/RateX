// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDex.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import "./interfaces/IERC20.sol";

contract UniswapV3Dex is IDex {

    IQuoter public quoter;

    constructor(address _quoterAddress){
        quoter = IQuoter(_quoterAddress);
    }

    function swap(
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    ) external returns(uint amountOut) {
        return 0; // TODO:: implement later
    }

    // not used in milestone2
    function quote(address _tokenIn, address _tokenOut, uint _amountIn) external view returns(uint amountOut) {
        return 0;
    }

    function quoteV2(address _poolAddress, address _tokenIn, address _tokenOut, uint _amountIn)
        external
        returns(uint reserveIn, uint reserveOut, uint amountOut)
    {
        reserveIn = IERC20(_tokenIn).balanceOf(_poolAddress);
        reserveOut = IERC20(_tokenOut).balanceOf(_poolAddress);
        amountOut = quoter.quoteExactInputSingle(
            _tokenIn,
            _tokenOut,
            IUniswapV3Pool(_poolAddress).fee(),
            _amountIn,
            0
        );
    }
}
