// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IFactoryCurvePoolRegistry {

    function get_coins(address _poolAddress) external view returns(address[] memory);
}
