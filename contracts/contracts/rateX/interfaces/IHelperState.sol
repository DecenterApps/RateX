// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IHelperState {
    struct Token {
        address _address;
        uint256 decimals;
    }

    struct PoolInfo {
        address poolId;
        string dexId;
        Token[] tokens;
    }
}
