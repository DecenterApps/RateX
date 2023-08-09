// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/sushiV2/ISushiSwapV2Pair.sol";
import "hardhat/console.sol";

library SushiSwapV2Library {

    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'SushiSwapV2Library: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'SushiSwapV2Library: ZERO_ADDRESS');
    }

    function getReserves(address pair, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint reserve0, uint reserve1,) = ISushiSwapV2Pair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }
    // used for milestone 1
    function quote(address _pair, address _tokenIn, address _tokenOut, uint _amountIn) external view returns (uint amountOut) {
        (uint reserveIn, uint reserveOut) = getReserves(_pair, _tokenIn, _tokenOut);
        require(_amountIn > 0, 'SushiSwapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'SushiSwapV2Library: INSUFFICIENT_LIQUIDITY');
        amountOut = (_amountIn * 997 * reserveOut) / (reserveIn * 1000 + _amountIn * 997);
    }
    // used for milestone 2
    function quoteV2(address _pair, address _tokenIn, address _tokenOut, uint _amountIn) external view returns (uint reserveIn, uint reserveOut, uint amountOut) {
        (reserveIn, reserveOut) = getReserves(_pair, _tokenIn, _tokenOut);
        require(_amountIn > 0, 'SushiSwapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'SushiSwapV2Library: INSUFFICIENT_LIQUIDITY');
        amountOut = (_amountIn * 997 * reserveOut) / (reserveIn * 1000 + _amountIn * 997);
    }
}
