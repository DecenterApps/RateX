// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IDex.sol';
import './interfaces/balancer/IVault.sol';
import './interfaces/balancer/IWeightedPool.sol';
import './interfaces/balancer/IStablePool.sol';

import "hardhat/console.sol";

contract BalancerDex is IDex {
  enum PoolType {
    Weighted,
    Stable,
    Linear
  }

  IVault private balancerVault;

  constructor(address _balancerVault) {
    console.log("POZOVEMO KONSTRUKTOR ", _balancerVault);
    balancerVault = IVault(_balancerVault);
    console.log("ZAVRSI SE KONSTRUKTOR ", _balancerVault);
  }

  function swap(
    address _poolAddress,
    address _tokenIn,
    address _tokenOut,
    uint _amountIn,
    uint _amountOutMin,
    address _to
  ) external override returns (uint amountOut) {}

  function quote(address _tokenIn, address _tokenOut, uint _amountIn) external view override returns (uint amountOut) {}

  function quoteV2(
    address _poolAddress,
    address _tokenIn,
    address _tokenOut,
    uint _amountIn
  ) external override returns (uint reserveIn, uint reserveOut, uint amountOut) {}

  function getPool(bytes32 _poolId) external view returns (address poolAddress) {
    (poolAddress, ) = balancerVault.getPool(_poolId);
  }

  function getWeightedPoolInfo(
    bytes32 _poolId
  )
    external
    view
    returns (uint8 decimals, uint256 invariant, address[] memory tokens, uint256[] memory balances, uint256[] memory weights, uint256 feePercentage)
  {
    console.log("USAO U FUNKCIJU");
    console.logBytes32(_poolId);
    IWeightedPool pool = IWeightedPool(this.getPool(_poolId));
    console.log("ZAVRSIO SE GETPOOL");
    decimals = pool.decimals();
    console.log("ZAVRSIO SE DECIMALS");
    // invariant = pool.getInvariant();
    // console.log("ZAVRSIO SE INVARIANT");
    weights = pool.getNormalizedWeights();
    require(weights.length > 0, "Weights are empty");
    console.log("ZAVRSIO SE NORMALIZED");
    feePercentage = pool.getSwapFeePercentage();
    console.log("ZAVRSIO SE SWAPFEE");

    (tokens, balances, ) = balancerVault.getPoolTokens(_poolId);
    console.log("ZAVRSIO SE GETPOOLTOKEN");
  }

  function getStablePoolInfo(
    bytes32 _poolId
  )
    external
    view
    returns (uint8 decimals, address[] memory tokens, uint256[] memory balances, uint256 aValue, uint256 aPrecision, uint256 feePercentage)
  {
    console.log("USAO U FUNKCIJU");
    IStablePool pool = IStablePool(this.getPool(_poolId));
    decimals = pool.decimals();
    console.log("ZAVRSIO SE DECIMALS");
    (aValue, , aPrecision) = pool.getAmplificationParameter();
    console.log("ZAVRSIO SE amp");
    feePercentage = pool.getSwapFeePercentage();
    console.log("ZAVRSIO SE fee");

    (tokens, balances, ) = balancerVault.getPoolTokens(_poolId);
    console.log("ZAVRSIO SE gettokens");
  }
}
