// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IFactoryCurvePoolRegistryNonStable {

    function get_coins(address _poolAddress) external view returns(address[4] memory);
}
