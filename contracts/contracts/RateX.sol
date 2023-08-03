// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDex.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SushiSwapDex.sol";

// The most basic test contract for now, do swap on sushi
contract RateX is Ownable {

    mapping(string => address) public dexes;

    constructor(address _sushiSwapDexAddress){
        dexes["SUSHI_V2"] = _sushiSwapDexAddress;
    }

    function swap(
        address _tokenIn,
        address _tokenOut,
        uint _amountIn,
        uint _minAmountOut,
        address _to,
        string memory _dexId
    )
    external
    {
        require(dexes[_dexId] != address(0), "Dex not supported");

        // move this later in separate contract
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        IERC20(_tokenIn).approve(dexes[_dexId], _amountIn);

        uint amountOut = IDex(dexes[_dexId]).swap(
            _tokenIn,
            _tokenOut,
            _amountIn,
            _minAmountOut,
            _to
        );
        require(amountOut >= _minAmountOut, "Amount lesser than min amount");
    }

    function quote(string memory _dexId, address _tokenIn, address _tokenOut, uint _amountIn) external view returns (uint amountOut){
        require(dexes[_dexId] != address(0), "Dex not supported");
        amountOut = IDex(dexes[_dexId]).quote(_tokenIn, _tokenOut, _amountIn);
    }

}
