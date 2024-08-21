// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SushiSwapV2Library} from './SushiSwapV2Library.sol';
import {IHelperState} from '../rateX/interfaces/IHelperState.sol';

/// @title SushiSwapHelper - A helper contract for fetching SushiSwap V2 pools data
/// @notice This contract provides utility functions to retrieve information from SushiSwap V2 pools
contract SushiSwapHelper is IHelperState {
  struct SushiSwapV2Pool {
    address poolId;
    string dexId;
    Token[] tokens;
    uint[] reserves;
  }

  /// @notice Retrieves data for multiple SushiSwap V2 pools
  /// @param poolsInfo An array of PoolInfo containing information about each pool
  /// @return pools An array of SushiSwapV2Pool structures containing the data for each pool
  function getPoolsData(PoolInfo[] memory poolsInfo) external view returns (SushiSwapV2Pool[] memory pools) {
    pools = new SushiSwapV2Pool[](poolsInfo.length);
    for (uint256 i = 0; i < poolsInfo.length; i++) {
      PoolInfo memory poolInfo = poolsInfo[i];

      uint[] memory reserves;
      reserves = new uint[](2);

      (reserves[0], reserves[1]) = SushiSwapV2Library.getReserves(
        poolInfo.poolId,
        poolInfo.tokens[0]._address,
        poolInfo.tokens[1]._address
      );

      pools[i] = SushiSwapV2Pool(poolInfo.poolId, poolInfo.dexId, poolInfo.tokens, reserves);
    }
  }
}
