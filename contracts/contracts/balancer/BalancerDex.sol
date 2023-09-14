// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../rateX/interfaces/IDex.sol";
import './interfaces/IVault.sol';
import './interfaces/IWeightedPool.sol';
import '../rateX/libraries/TransferHelper.sol';

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
        address _poolAddress,
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    ) external override returns (uint amountOut) {

        TransferHelper.safeTransferFrom(_tokenIn, msg.sender, address(this), _amountIn);
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

        amountOut = balancerVault.swap(
            singleSwap,
            fundManagement,
            _amountOutMin,
            block.timestamp
        );

        emit TestAmountOutEvent(amountOut);
    }
}
