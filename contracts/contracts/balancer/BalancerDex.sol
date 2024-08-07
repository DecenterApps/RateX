// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IDex} from '../rateX/interfaces/IDex.sol';
import {IVault} from './interfaces/IVault.sol';
import {IWeightedPool} from './interfaces/IWeightedPool.sol';
import {TransferHelper} from '../rateX/libraries/TransferHelper.sol';

contract BalancerDex is IDex {
  enum PoolType {
    Weighted,
    Stable,
    Linear
  }

  IVault private immutable balancerVault;

  constructor(address _balancerVault) {
    balancerVault = IVault(_balancerVault);
  }

  function swap(
    bytes calldata _data,
    uint _amountIn,
    uint _amountOutMin,
    address _to,
    uint _deadline
  ) external override returns (uint amountOut) {
    (address _poolAddress, address _tokenIn, address _tokenOut) = abi.decode(_data, (address, address, address));
    
    TransferHelper.safeApprove(_tokenIn, address(balancerVault), _amountIn);

    IWeightedPool pool = IWeightedPool(_poolAddress);
    bytes32 poolId = pool.getPoolId();

    IVault.SingleSwap memory singleSwap;
    singleSwap.poolId = poolId;
    singleSwap.kind = IVault.SwapKind.GIVEN_IN;
    singleSwap.assetIn = _tokenIn;
    singleSwap.assetOut = _tokenOut;
    singleSwap.amount = _amountIn;

    IVault.FundManagement memory fundManagement;
    fundManagement.sender = address(this);
    fundManagement.fromInternalBalance = false;
    fundManagement.recipient = payable(_to);
    fundManagement.toInternalBalance = false;

    amountOut = balancerVault.swap(singleSwap, fundManagement, _amountOutMin, _deadline);

    emit TestAmountOutEvent(amountOut);
  }
}
