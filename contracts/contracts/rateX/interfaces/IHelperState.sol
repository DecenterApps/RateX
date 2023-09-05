// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IHelperState {
    struct Token {
        address _address;
        uint decimals;
    }

    struct PoolInfo {
        address poolId;
        string dexId;
        Token[] tokens;
    }
}
