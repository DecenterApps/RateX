// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../rateX/interfaces/IDex.sol";
import "./interfaces/ICurvePool.sol";
import "./interfaces/ICurvePoolRegistry.sol";
import "../rateX/libraries/TransferHelper.sol";

contract CurveDex is IDex {

    ICurvePoolRegistry private immutable curvePoolRegistry;

    constructor(address _curvePoolRegistry){
        curvePoolRegistry = ICurvePoolRegistry(_curvePoolRegistry);
    }

    function swap(
        address _poolAddress,
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _amountOutMin,
        address _to
    ) external override returns(uint256 amountOut) {

        TransferHelper.safeTransferFrom(_tokenIn, msg.sender, address(this), _amountIn);
        TransferHelper.safeApprove(_tokenIn, _poolAddress, _amountIn);

        (int128 i, int128 j) = findTokenIndexes(_poolAddress, _tokenIn, _tokenOut);
        require(i >= 0 && j >= 0, "Tokens not found in pool");

        amountOut = ICurvePool(_poolAddress).exchange(
            i,
            j,
            _amountIn,
            _amountOutMin,
            _to
        );

        emit TestAmountOutEvent(amountOut);
    }

    function findTokenIndexes(
        address _poolAddress,
        address _tokenIn,
        address _tokenOut
    )
    internal view returns (int128 i, int128 j)
    {
        address[8] memory coins = curvePoolRegistry.get_coins(_poolAddress);

        i = -1;
        j = -1;

        for (uint256 k = 0; k < 8; ++k) {
            if (coins[k] == _tokenIn) {
                i = int128(int256(k));
            }
            if (coins[k] == _tokenOut) {
                j = int128(int256(k));
            }
        }
    }
}
