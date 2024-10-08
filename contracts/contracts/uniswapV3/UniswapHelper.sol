// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IUniswapV3Pool} from '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import {IUniswapV3PoolImmutables} from '@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolImmutables.sol';

import {TickBitmap} from './libraries/TickBitmap.sol';
import {TickMath} from './libraries/TickMath.sol';
import {LowGasSafeMath} from './libraries/LowGasSafeMath.sol';
import {LiquidityMath} from './libraries/LiquidityMath.sol';
import {SwapMath} from './libraries/SwapMath.sol';
import {SafeCast} from './libraries/SafeCast.sol';

import {IUniswapHelper} from './interfaces/IUniswapHelper.sol';
import {UniViewQuoter} from './UniViewQuoter.sol';

/// @title UniswapHelper - A helper contract for fetching data from Uniswap V3 pools
/// @notice This contract provides utility functions to retrieve detailed information from Uniswap V3 pools
contract UniswapHelper is UniViewQuoter, IUniswapHelper {
  using LowGasSafeMath for uint256;
  using LowGasSafeMath for int256;
  using SafeCast for uint256;
  using SafeCast for int256;

  /// @notice Fetches data for multiple Uniswap V3 pools
  /// @param _pools An array of pool addresses to fetch data from
  /// @param _numOfTicks The number of ticks to retrieve data for
  /// @return poolData An array of PoolData structures containing the data for each pool
  function fetchData(address[] calldata _pools, uint256 _numOfTicks) external view override returns (PoolData[] memory poolData) {
    poolData = new PoolData[](_pools.length);
    for (uint256 i = 0; i < _pools.length; i++) {
      poolData[i] = _fetchPoolData(_pools[i], _numOfTicks);
    }
  }

  /// @notice Fetches data for a single Uniswap V3 pool
  /// @param _pool The address of the pool to fetch data from
  /// @param _numOfTicks The number of ticks to retrieve data for
  /// @return The PoolData structure containing the data for the specified pool
  function fetchPoolData(address _pool, uint256 _numOfTicks) external view override returns (PoolData memory) {
    return _fetchPoolData(_pool, _numOfTicks);
  }

  function _fetchPoolData(address _pool, uint256 _numOfTicks) internal view returns (PoolData memory) {
    IUniswapV3Pool pool = IUniswapV3Pool(_pool);
    IUniswapV3PoolImmutables immutables = IUniswapV3PoolImmutables(_pool);
    (uint160 sqrtPriceX96, int24 tick, , , , , ) = pool.slot0();
    (, int128 liquidityNet, , , , , , ) = pool.ticks(tick);

    PoolInfo memory info = PoolInfo({
      pool: _pool,
      token0: immutables.token0(),
      token1: immutables.token1(),
      tick: tick,
      tickLiquidityNet: liquidityNet,
      tickSpacing: immutables.tickSpacing(),
      fee: immutables.fee(),
      sqrtPriceX96: sqrtPriceX96,
      liquidity: pool.liquidity()
    });

    return
      PoolData({info: info, zeroForOneTicks: _fetchTicks(info, _numOfTicks, true), oneForZeroTicks: _fetchTicks(info, _numOfTicks, false)});
  }

  function _fetchTicks(PoolInfo memory _info, uint256 _numOfTicks, bool _zeroForOne) internal view returns (TickData[] memory) {
    TickData[] memory ticks = new TickData[](_numOfTicks);
    int24 tick = _info.tick;
    int128 liquidityNet;
    bool initialized;
    for (uint256 i = 0; i < _numOfTicks; ++i) {
      (tick, initialized) = TickBitmap.nextInitializedTickWithinOneWord(_info.pool, tick, _info.tickSpacing, _zeroForOne);

      if (initialized) {
        (, liquidityNet, , , , , , ) = IUniswapV3Pool(_info.pool).ticks(tick);
      } else {
        liquidityNet = 0;
      }

      ticks[i] = TickData({tick: tick, initialized: initialized, liquidityNet: liquidityNet});

      if (_zeroForOne) tick -= 1;
    }
    return ticks;
  }
}
