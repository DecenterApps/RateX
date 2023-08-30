// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDex.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./../sushiV2/SushiSwapDex.sol";
import "hardhat/console.sol";

// The most basic test contract for now, do swap on sushi
contract RateX is Ownable {

    event SwapEvent(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address recipient
    );

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

    struct SwapStep {
        address poolId;
        string dexId;
        address tokenA;
        address tokenB;
    }

    struct Route {
        SwapStep[] swaps;
        uint256 amountOut;
        uint256 percentage;
    }


    mapping(string => address) public dexes;

    constructor(address _sushiSwapDexAddress, address _uniswapV3DexAddress, address _balancerV2DexAddress){
        dexes["SUSHI_V2"] = _sushiSwapDexAddress;
        dexes["UNI_V3"] = _uniswapV3DexAddress;
        dexes["BALANCER_V2_WEIGHTED"] = _balancerV2DexAddress;
    }

    // swap function for multi hop, without spliting
    // basic version for now to test
    // implement and test full logic later when we have splits
    function swapMultiHop(
        Route calldata _route,
        uint256 _amountIn,
        uint256 _quotedAmountWithSlippage,
        address _recipient
    ) external returns(uint256 amountOut) {
        console.log("swapMultiHop");
        require(_route.swaps.length > 0, "No swaps in route");

        address tokenIn = _route.swaps[0].tokenA;
        address tokenOut = _route.swaps[_route.swaps.length - 1].tokenB;

        IERC20(tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        amountOut = _amountIn;

        for (uint256 i = 0; i < _route.swaps.length; ++i) {
            SwapStep memory swapStep = _route.swaps[i];
            console.log(swapStep.dexId);
            console.log(swapStep.tokenA);
            console.log(swapStep.tokenB);
            console.log(swapStep.poolId);

            amountOut = _executeSwapStep(swapStep, amountOut, _recipient);
        }

        require(amountOut >= _quotedAmountWithSlippage, "Amount lesser than min amount");

        IERC20(tokenOut).transfer(_recipient, amountOut);

        emit SwapEvent(tokenIn, tokenOut, _amountIn, amountOut, _recipient);
    }

    function _executeSwapStep(
        SwapStep memory _swapStep,
        uint256 _amountIn,
        address _recipient
    )
    private returns(uint256 amountOut)
    {
        IERC20(_swapStep.tokenA).approve(dexes[_swapStep.dexId], _amountIn);

        amountOut = IDex(dexes[_swapStep.dexId]).swap(
            _swapStep.poolId,
            _swapStep.tokenA,
            _swapStep.tokenB,
            _amountIn,
            0,
            address(this)
        );
    }

    // without route, only through one dex for now
    function swap(
        address _poolAddress,
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
            _poolAddress,
            _tokenIn,
            _tokenOut,
            _amountIn,
            _minAmountOut,
            _to
        );
        require(amountOut >= _minAmountOut, "Amount lesser than min amount");
    }

    /* USED OR MILESTONES 1 and 2
    function quote(string memory _dexId, address _tokenIn, address _tokenOut, uint _amountIn) external view returns (uint amountOut){
        require(dexes[_dexId] != address(0), "Dex not supported");
        amountOut = IDex(dexes[_dexId]).quote(_tokenIn, _tokenOut, _amountIn);
    }

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
    */

}