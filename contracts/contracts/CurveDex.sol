// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDex.sol";
import "./interfaces/curve/ICurveDEX.sol";
import "hardhat/console.sol";

contract CurveDex is IDex {

    // ISushiSwapV2Factory private sushiFactory
    ICurveStableSwapDEX private curvePool;

    constructor(address _curvePool) {
        curvePool = ICurveStableSwapDEX(_curvePool);
    }

  function swap(
    address _poolAddress,
    address _tokenIn,
    address _tokenOut,
    uint _amountIn,
    uint _amountOutMin,
    address _to
  ) external override returns (uint amountOut) {}

  function printHelloWorld() pure public returns (string memory) {
      return "Hello World";
  }

  function getPoolInfo() external view returns (uint256 decimals, uint256 A, uint256 poolFee, uint256[2] memory balances) {
      decimals = curvePool.decimals();
      A = curvePool.A();
      poolFee = curvePool.fee();
      balances = curvePool.get_balances();
      return (decimals, A, poolFee, balances);
  }
  
  function coins(uint256 i) external view returns (address coin) {
    uint256 arg0 = i;
    coin = curvePool.coins(arg0);
  }

  function get_dy(int128 i, int128 j, uint256 dx) private view returns (uint256 dy) {
    dy = curvePool.get_dy(i, j, dx);
  }

  function getTokenIndex(address token) private view returns (int128 index) {
    index = -1;
    for (uint256 k = 0; k < 2; k++) {
      if (curvePool.coins(k) == token) {
        index = int128(int256(k));
      }
    }
    require(index > -1, "token not found");
  }

  function getAmountOut(address tokenIn, address tokenFrom, uint256 amountIn) external view returns (uint256 amountOut) {
    int128 i = getTokenIndex(tokenIn);
    int128 j = getTokenIndex(tokenFrom);

    amountOut = 1;
    amountOut = get_dy(i, j, amountIn);
  }
}
