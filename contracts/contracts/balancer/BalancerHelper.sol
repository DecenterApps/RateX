// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './BalancerDex.sol';
import './interfaces/IWeightedPool.sol';
import './interfaces/IStablePool.sol';

contract BalancerHelper {

    IVault private immutable balancerVault;

    constructor(address _balancerVault) {
        balancerVault = IVault(_balancerVault);
    }

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
}
