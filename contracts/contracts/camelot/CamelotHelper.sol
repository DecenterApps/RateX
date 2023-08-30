// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './CamelotDex.sol';

contract CamelotHelper {

    CamelotDex camelotDex = new CamelotDex();

    struct Token {
        address _address;
        uint decimals;
    }

    struct PoolInfo {
        address poolId;
        string dexId;
        Token[] tokens;
    }

    struct CamelotPool {
        address poolId;
        string dexId;
        Token[] tokens;
        uint16[2] fees;
        uint112[2] reserves;
        bool stableSwap;
    }

    function getPoolsData(PoolInfo[] memory poolsInfo) external view returns(CamelotPool[] memory pools){
        
        pools = new CamelotPool[](poolsInfo.length);

        for (uint i = 0; i < poolsInfo.length; i++) {

            PoolInfo memory poolInfo = poolsInfo[i];

            uint112[2] memory reserves;
            uint16[2] memory fees;
            (reserves[0], reserves[1], fees[0], fees[1]) = camelotDex.getPoolInfo(poolInfo.poolId);

            bool stableSwap = camelotDex.getStableSwap(poolInfo.poolId);

            pools[i] = CamelotPool(
                poolInfo.poolId,
                poolInfo.dexId,
                poolInfo.tokens,
                fees,
                reserves,
                stableSwap
            );
        }
    }
}
