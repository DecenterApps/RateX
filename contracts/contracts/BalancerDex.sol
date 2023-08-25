// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IDex.sol';
import './interfaces/balancer/IVault.sol';
import './interfaces/balancer/IWeightedPool.sol';
import './interfaces/balancer/IStablePool.sol';

contract BalancerDex is IDex {
  enum PoolType {
    Weighted,
    Stable,
    Linear
  }

  IVault private balancerVault;

  constructor(address _balancerVault) {
    balancerVault = IVault(_balancerVault);
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
    IWeightedPool pool = IWeightedPool(this.getPool(_poolId));
    decimals = pool.decimals();
    invariant = pool.getInvariant();
    weights = pool.getNormalizedWeights();
    feePercentage = pool.getSwapFeePercentage();

    (tokens, balances, ) = balancerVault.getPoolTokens(_poolId);
  }

  function getStablePoolInfo(
    bytes32 _poolId
  )
    external
    view
    returns (uint8 decimals, address[] memory tokens, uint256[] memory balances, uint256 aValue, uint256 aPrecision, uint256 feePercentage)
  {
    IStablePool pool = IStablePool(this.getPool(_poolId));
    decimals = pool.decimals();
    (aValue, , aPrecision) = pool.getAmplificationParameter();
    feePercentage = pool.getSwapFeePercentage();

    (tokens, balances, ) = balancerVault.getPoolTokens(_poolId);
  }
}
