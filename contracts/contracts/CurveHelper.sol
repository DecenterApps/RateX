// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/curve/ICurveDEX.sol";

contract CurveHelper {
    struct Token {
        address _address;
        uint decimals;
    }

    struct PoolInfo {
        address poolId;
        string dexId;
        Token[] tokens;
    }

    struct CurvePool {
        address poolId;
        string dexId;
        Token[] tokens;
        uint[] balances;
        uint fee;
        uint A;
    }

    function getPoolsData(PoolInfo[] memory poolsInfo) external view returns(CurvePool[] memory pools){
        pools = new CurvePool[](poolsInfo.length);
        for (uint i = 0; i < poolsInfo.length; i++) {
            PoolInfo memory poolInfo = poolsInfo[i];

            uint[] memory balances;
            balances = new uint[](poolInfo.tokens.length);
            for (uint j = 0; j < balances.length; j++) {
                balances[j] = ICurveStableSwapDEX(poolInfo.poolId).balances(j);
            }

            uint fee = ICurveStableSwapDEX(poolInfo.poolId).fee();
            uint A = ICurveStableSwapDEX(poolInfo.poolId).A();

            pools[i] = CurvePool(
                poolInfo.poolId,
                poolInfo.dexId,
                poolInfo.tokens,
                balances,
                fee,
                A
            );
        }
    }

}
