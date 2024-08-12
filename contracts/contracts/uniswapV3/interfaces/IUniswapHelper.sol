// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IUniswapState} from "./IUniswapState.sol";
import {IUniswapViewQuoter} from "./IUniswapViewQuoter.sol";

interface IUniswapHelper is IUniswapState, IUniswapViewQuoter {

    function fetchData(address[] calldata _pools, uint256 _numOfTicks) external view returns (PoolData[] memory poolData);

    function fetchPoolData(address _pool, uint256 _numOfTicks) external view returns (PoolData memory);
}
