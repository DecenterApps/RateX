// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IWeightedPool} from './interfaces/IWeightedPool.sol';
import {IStablePool} from './interfaces/IStablePool.sol';
import {IVault} from './interfaces/IVault.sol';

/// @title BalancerHelper - A helper contract for fetching Balancer pools data
/// @notice This contract provides utility functions to retrieve information from Balancer pools
contract BalancerHelper {
  IVault private immutable balancerVault;

  constructor(address _balancerVault) {
    balancerVault = IVault(_balancerVault);
  }

  /// @notice Retrieves data about a weighted pool
  /// @param _poolId The unique identifier of the Balancer pool
  /// @return decimals The number of decimals used by the pool
  /// @return tokens An array of token addresses in the pool
  /// @return balances An array of token balances corresponding to the tokens in the pool
  /// @return weights An array of normalized weights for each token in the pool
  /// @return feePercentage The swap fee percentage applied by the pool
  function getWeightedPoolInfo(
    bytes32 _poolId
  )
    external
    view
    returns (uint8 decimals, address[] memory tokens, uint256[] memory balances, uint256[] memory weights, uint256 feePercentage)
  {
    IWeightedPool pool = IWeightedPool(getPool(_poolId));
    decimals = pool.decimals();
    weights = pool.getNormalizedWeights();
    require(weights.length > 0, 'Weights are empty');
    feePercentage = pool.getSwapFeePercentage();

    (tokens, balances, ) = balancerVault.getPoolTokens(_poolId);
  }

  function getPool(bytes32 _poolId) internal view returns (address poolAddress) {
    (poolAddress, ) = balancerVault.getPool(_poolId);
  }
}
