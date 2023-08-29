// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/ICamelotPair.sol';
import "../rateX/interfaces/IDex.sol";

import 'hardhat/console.sol';

contract CamelotDex is IDex {
    constructor() {}

    function swap(
        address _poolAddress,
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    ) external returns(uint amountOut) {}

    function getPoolInfo(address id) external view returns (uint112 reserve0, uint112 reserve1, uint16 token0feePercent, uint16 token1FeePercent) {
        ICamelotPair pair = ICamelotPair(id);
        return pair.getReserves();
    }
}