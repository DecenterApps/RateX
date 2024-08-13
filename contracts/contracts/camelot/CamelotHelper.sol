// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ICamelotPair} from './interfaces/ICamelotPair.sol';
import {IHelperState} from '../rateX/interfaces/IHelperState.sol';

contract CamelotHelper is IHelperState {
  struct CamelotPool {
    address poolId;
    string dexId;
    Token[] tokens;
    uint112[2] reserves;
    uint16[2] fees;
    bool stableSwap;
  }

  function getPoolsData(PoolInfo[] memory poolsInfo) external view returns (CamelotPool[] memory pools) {
    pools = new CamelotPool[](poolsInfo.length);

    for (uint256 i = 0; i < poolsInfo.length; i++) {
      PoolInfo memory poolInfo = poolsInfo[i];

      uint112[2] memory reserves;
      uint16[2] memory fees;
      (reserves[0], reserves[1], fees[0], fees[1]) = ICamelotPair(poolInfo.poolId).getReserves();

      bool stableSwap = ICamelotPair(poolInfo.poolId).stableSwap();

      pools[i] = CamelotPool(poolInfo.poolId, poolInfo.dexId, poolInfo.tokens, reserves, fees, stableSwap);
    }
  }
}
