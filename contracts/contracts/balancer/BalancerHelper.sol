// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './interfaces/IWeightedPool.sol';
import './interfaces/IStablePool.sol';
import "./interfaces/IVault.sol";

contract BalancerHelper {

    IVault private immutable balancerVault;

    constructor(address _balancerVault) {
        balancerVault = IVault(_balancerVault);
    }

    function getWeightedPoolInfo(bytes32 _poolId)
    external
    view
    returns (uint8 decimals, uint256 invariant, address[] memory tokens, uint256[] memory balances, uint256[] memory weights, uint256 feePercentage)
    {
        IWeightedPool pool = IWeightedPool(getPool(_poolId));
        decimals = pool.decimals();
        weights = pool.getNormalizedWeights();
        require(weights.length > 0, "Weights are empty");
        feePercentage = pool.getSwapFeePercentage();

        (tokens, balances,) = balancerVault.getPoolTokens(_poolId);
    }

    function getPool(bytes32 _poolId) internal view returns (address poolAddress) {
        (poolAddress,) = balancerVault.getPool(_poolId);
    }
}
