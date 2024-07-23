// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ICurvePool} from './interfaces/ICurvePool.sol';
import {IHelperState} from '../rateX/interfaces/IHelperState.sol';

contract CurveHelper is IHelperState {
  struct CurvePool {
    address poolId;
    string dexId;
    Token[] tokens;
    uint[] balances;
    uint fee;
    uint A;
  }

  function getPoolsData(PoolInfo[] memory poolsInfo) external view returns (CurvePool[] memory pools) {
    pools = new CurvePool[](poolsInfo.length);
    for (uint i = 0; i < poolsInfo.length; i++) {
      PoolInfo memory poolInfo = poolsInfo[i];

      uint[] memory balances = new uint[](poolInfo.tokens.length);
      for (uint j = 0; j < balances.length; j++) {
        balances[j] = ICurvePool(poolInfo.poolId).balances(j);
      }

      uint fee = ICurvePool(poolInfo.poolId).fee();
      uint A = ICurvePool(poolInfo.poolId).A();

      pools[i] = CurvePool(poolInfo.poolId, poolInfo.dexId, poolInfo.tokens, balances, fee, A);
    }
  }
}
