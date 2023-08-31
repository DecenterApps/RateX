// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../rateX/interfaces/IDex.sol";
import "../rateX/interfaces/IERC20.sol";
import './interfaces/IVault.sol';
import './interfaces/IWeightedPool.sol';
import './interfaces/IStablePool.sol';

import "hardhat/console.sol";

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

  function getPool(bytes32 _poolId) external view returns (address poolAddress) {
      (poolAddress, ) = balancerVault.getPool(_poolId);
  }

  function swap(
    address _poolAddress,
    address _tokenIn,
    address _tokenOut,
    uint _amountIn,
    uint _amountOutMin,
    address _to
  ) external override returns (uint amountOut) {
    // remove approval in separate contract later
    IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
    IERC20(_tokenIn).approve(address(this), _amountIn);
    IERC20(_tokenIn).approve(address(balancerVault), _amountIn);
    IERC20(_tokenIn).approve(_poolAddress, _amountIn);

    IWeightedPool pool = IWeightedPool(_poolAddress);
    bytes32 _poolId = pool.getPoolId();

    IVault.SingleSwap memory singleSwap;
    singleSwap.poolId = _poolId;
    singleSwap.kind = IVault.SwapKind.GIVEN_IN;
    singleSwap.assetIn = _tokenIn;
    singleSwap.assetOut = _tokenOut;
    singleSwap.amount = _amountIn;

    IVault.FundManagement memory fundManagement;
    fundManagement.sender = address(this);
    fundManagement.fromInternalBalance = false;
    fundManagement.recipient = payable(_to);
    fundManagement.toInternalBalance = false;

    amountOut = balancerVault.swap(
      singleSwap,
      fundManagement,
      _amountOutMin,
      9999999999999999999999999999999999999
    );
  }

  function swapWeightedToken(
    bytes32 _poolId, 
    address tokenA, 
    address tokenB, 
    uint256 amountA
  ) 
    external
    payable 
    returns (uint256 amountB) 
  {
    IWeightedPool pool = IWeightedPool(this.getPool(_poolId));
    address poolAddress = pool.getPool();
    
    this.swap(
      poolAddress,
      tokenA,
      tokenB,
      amountA,
      0,
      msg.sender
    );
  }
}