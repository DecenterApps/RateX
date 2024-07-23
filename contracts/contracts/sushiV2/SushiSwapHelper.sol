// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {SushiSwapV2Library} from "./SushiSwapV2Library.sol";
import {IHelperState} from "../rateX/interfaces/IHelperState.sol";

contract SushiSwapHelper is IHelperState {

    struct SushiSwapV2Pool {
        address poolId;
        string dexId;
        Token[] tokens;
        uint[] reserves;
    }

    function getPoolsData(PoolInfo[] memory poolsInfo) external view returns(SushiSwapV2Pool[] memory pools){
        pools = new SushiSwapV2Pool[](poolsInfo.length);
        for (uint i = 0; i < poolsInfo.length; i++) {
            PoolInfo memory poolInfo = poolsInfo[i];

            uint[] memory reserves;
            reserves = new uint[](2);

            (reserves[0], reserves[1]) = SushiSwapV2Library.getReserves(
                poolInfo.poolId,
                poolInfo.tokens[0]._address,
                poolInfo.tokens[1]._address
            );

            pools[i] = SushiSwapV2Pool(
                poolInfo.poolId,
                poolInfo.dexId,
                poolInfo.tokens,
                reserves
            );
        }
    }
}
