// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IDex.sol';
import './interfaces/balancer/IVault.sol';
import './interfaces/balancer/IWeightedPool.sol';
import './interfaces/balancer/IStablePool.sol';
import './interfaces/IERC20.sol';

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
  ) external override returns (uint amountOut) {
    console.log("POZOVEMO SWAP ! GAS LASKcnASNKJ ");
    console.log(msg.sender, address(this)); 
    // remove approval in separate contract later
    IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
    IERC20(_tokenIn).approve(address(this), _amountIn);
    IERC20(_tokenIn).approve(address(balancerVault), _amountIn);
    IERC20(_tokenIn).approve(_poolAddress, _amountIn);
    console.log("!");
    console.log(IERC20(_tokenIn).balanceOf(address(this)), _tokenIn);

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
    fundManagement.fromInternalBalance = true;
    fundManagement.recipient = payable(_to);
    fundManagement.toInternalBalance = true;

    console.log("POZOVEMO SWAP ? ");
    console.logBytes32(_poolId);
    console.logAddress(_tokenIn);
    console.logAddress(_tokenOut);
    console.logUint(_amountIn);
    console.logUint(_amountOutMin);
    console.logAddress(_to);
    console.logAddress(msg.sender);
    console.logAddress(address(balancerVault));

    console.log("PROVERA Br. 2");
    
    // IVault(balancerVault).setRelayerApproval(msg.sender, msg.sender, true); console.log("setRelayerApproval 0s"); // ne radi
    // IVault(balancerVault).setRelayerApproval(msg.sender, _poolAddress, true); console.log("setRelayerApproval 1s"); // ne radi
    // IVault(balancerVault).setRelayerApproval(msg.sender, address(this), true); console.log("setRelayerApproval 2s"); // ne radi

    amountOut = balancerVault.swap(
      singleSwap,
      fundManagement,
      0,
      9999999999999999999999999999999999999
    );
  }

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
    console.logBytes32(_poolId);
    IWeightedPool pool = IWeightedPool(this.getPool(_poolId));
    decimals = pool.decimals();
    weights = pool.getNormalizedWeights();
    require(weights.length > 0, "Weights are empty");
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
