// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDex {

    function swap(
        address _poolAddress,
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    ) external returns(uint amountOut);

    // used in milestone1
    function quote(address _tokenIn, address _tokenOut, uint _amountIn) external view returns(uint amountOut);

    // use this for milestone2 ( Uniswap V3 and sushiV2 )
    function quoteV2(address _poolAddress, address _tokenIn, address _tokenOut, uint _amountIn)
        external
        returns(uint reserveIn, uint reserveOut, uint amountOut);
}
