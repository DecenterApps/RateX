// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDex.sol";
import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RateX is Ownable {

    event SwapEvent(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address recipient
    );

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

    constructor(address _sushiSwapDexAddress, address _uniswapV3DexAddress, address _curveDexAddress){
        dexes["SUSHI_V2"] = _sushiSwapDexAddress;
        dexes["UNI_V3"] = _uniswapV3DexAddress;
        dexes["CURVE"] = _curveDexAddress;
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

        require(_route.swaps.length > 0, "No swaps in route");

        address tokenIn = _route.swaps[0].tokenA;
        address tokenOut = _route.swaps[_route.swaps.length - 1].tokenB;

        IERC20(tokenIn).transferFrom(msg.sender, address(this), _amountIn);
        amountOut = _amountIn;

        for (uint256 i = 0; i < _route.swaps.length; ++i) {
            SwapStep memory swapStep = _route.swaps[i];
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
}
