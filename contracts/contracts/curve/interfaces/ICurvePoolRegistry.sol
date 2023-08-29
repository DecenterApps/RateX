// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurvePoolRegistry {

    function get_coins(address _poolAddress) external view returns(address[8] memory);
}
