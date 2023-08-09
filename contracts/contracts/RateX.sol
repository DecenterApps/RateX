// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDex.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SushiSwapDex.sol";

// The most basic test contract for now, do swap on sushi
contract RateX is Ownable {

    struct PoolEntry {
        address poolAddress;
        string dexId;
    }

    struct QuoteResultEntry {
        string dexId;
        address poolAddress;
        uint reserveA;
        uint reserveB;
        uint amountOut;
    }

    mapping(string => address) public dexes;

    constructor(address _sushiSwapDexAddress, address _uniswapV3DexAddress){
        dexes["SUSHI_V2"] = _sushiSwapDexAddress;
        dexes["UNI_V3"] = _uniswapV3DexAddress;
    }

    // without route, only through one dex for now
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

    // used for milestone1
    function quote(string memory _dexId, address _tokenIn, address _tokenOut, uint _amountIn) external view returns (uint amountOut){
        require(dexes[_dexId] != address(0), "Dex not supported");
        amountOut = IDex(dexes[_dexId]).quote(_tokenIn, _tokenOut, _amountIn);
    }

    // used for milestone2
    function quoteV2(PoolEntry[] memory poolEntries, address _tokenIn, address _tokenOut, uint _amountIn)
        external
        returns (QuoteResultEntry[] memory result)
    {
        result = new QuoteResultEntry[](poolEntries.length);
        for (uint i = 0; i < poolEntries.length; i++) {
            address poolAddress = poolEntries[i].poolAddress;

            (uint reserveIn, uint reserveOut, uint amountOut) = IDex(dexes[poolEntries[i].dexId]).quoteV2(
                poolAddress,
                _tokenIn,
                _tokenOut,
                _amountIn
            );

            result[i] = QuoteResultEntry(
                poolEntries[i].dexId,
                poolAddress,
                reserveIn,
                reserveOut,
                amountOut
            );
        }
    }

}
