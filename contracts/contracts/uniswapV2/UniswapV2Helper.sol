// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IHelperState} from '../rateX/interfaces/IHelperState.sol';
import {UniswapV2Library} from './UniswapV2Library.sol';

/// @title UniswapV2Helper - A helper contract for fetching Uniswap V2 pools data
/// @notice This contract provides utility functions to retrieve information from Uniswap V2 pools
contract UniswapV2Helper is IHelperState {
  struct UniswapV2Pool {
    address poolId;
    string dexId;
    Token[] tokens;
    uint[] reserves;
  }
  
  /// @notice Retrieves data for multiple Uniswap V2 pools
  /// @param poolsInfo An array of PoolInfo containing information about each pool
  /// @return pools An array of UniswapV2Pool structures containing the data for each pool
  function getPoolsData(PoolInfo[] memory poolsInfo) external view returns (UniswapV2Pool[] memory pools) {
    pools = new UniswapV2Pool[](poolsInfo.length);
    for (uint256 i = 0; i < poolsInfo.length; i++) {
      PoolInfo memory poolInfo = poolsInfo[i];

      uint[] memory reserves;
      reserves = new uint[](2);

      (reserves[0], reserves[1]) = UniswapV2Library.getReserves(poolInfo.poolId, poolInfo.tokens[0]._address, poolInfo.tokens[1]._address);

      pools[i] = UniswapV2Pool(poolInfo.poolId, poolInfo.dexId, poolInfo.tokens, reserves);
    }
  }
}
