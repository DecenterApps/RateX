// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './CamelotDex.sol';

contract CamelotHelper {

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
        uint112[2] reserves;
        uint16[2] fees;
        bool stableSwap;
    }

    function getPoolInfo(address id) external view returns (uint112 reserve0, uint112 reserve1, uint16 token0feePercent, uint16 token1FeePercent) {
        ICamelotPair pair = ICamelotPair(id);
        return pair.getReserves();
    }

    function getStableSwap(address id) external view returns (bool) {
        ICamelotPair pair = ICamelotPair(id);
        return pair.stableSwap();
    }

    function getPoolsData(PoolInfo[] memory poolsInfo) external view returns(CamelotPool[] memory pools){
        
        pools = new CamelotPool[](poolsInfo.length);

        for (uint i = 0; i < poolsInfo.length; i++) {

            PoolInfo memory poolInfo = poolsInfo[i];

            uint112[2] memory reserves;
            uint16[2] memory fees;
            (reserves[0], reserves[1], fees[0], fees[1]) = ICamelotPair(poolInfo.poolId).getReserves();

            bool stableSwap = ICamelotPair(poolInfo.poolId).stableSwap();

            pools[i] = CamelotPool(
                poolInfo.poolId,
                poolInfo.dexId,
                poolInfo.tokens,
                reserves,
                fees,
                stableSwap
            );
        }
    }
}
