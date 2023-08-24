// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IUniswapState.sol";

interface IUniswapHelper is IUniswapState {

    function fetchData(address[] calldata _pools, uint256 _numOfTicks) external view returns (PoolData[] memory poolData);

    function fetchPoolData(address _pool, uint256 _numOfTicks) external view returns (PoolData memory);

}
