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

    struct DexType {
        string dexId;
        address dexAddress;
    }

    struct SwapStep {
        address poolId;
        address tokenIn;
        address tokenOut;
        string dexId;
    }

    struct Route {
        SwapStep[] swaps;
        uint256 amountIn;
    }

    mapping(string => address) public dexes;

    constructor(DexType[] memory _initialDexes) {
        for (uint256 i = 0; i < _initialDexes.length; ++i) {
            dexes[_initialDexes[i].dexId] = _initialDexes[i].dexAddress;
        }
    }

    function swapWithSplit(
        Route[] calldata _foundRoutes,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _quotedAmountWithSlippage,
        address _recipient
    )
    external returns(uint256 amountOut)
    {
        // use errors instead later
        require(_foundRoutes.length > 0, "No routes in split route");

        // check if all routes are valid
        checkRoutesStructure(_foundRoutes, _amountIn, _tokenIn, _tokenOut);

        // use safeERC and helper contract for this later
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);

        uint256 balanceBefore = IERC20(_tokenOut).balanceOf(address(this));
        amountOut = swapForTotalAmountOut(_foundRoutes);
        uint256 balanceAfter = IERC20(_tokenOut).balanceOf(address(this));

        // make sure that we have exact new amountOut tokens to send to user
        require(balanceAfter - balanceBefore == amountOut, "Amount out does not match");

        // protect user to not get less than min amount
        require(amountOut >= _quotedAmountWithSlippage, "Amount lesser than min amount");

        // send all amountOut to user
        IERC20(_tokenOut).transfer(_recipient, amountOut);

        emit SwapEvent(_tokenIn, _tokenOut, _amountIn, amountOut, _recipient);
    }

    function checkRoutesStructure(
        Route[] calldata _foundRoutes,
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal pure {
        uint amountIn = 0;
        for (uint256 i = 0; i < _foundRoutes.length; ++i) {
            amountIn += _foundRoutes[i].amountIn;
            checkInputOutputTokens(_foundRoutes[i], _tokenIn, _tokenOut);
        }
        require(amountIn == _amountIn, "Amount in does not match");
    }

    function checkInputOutputTokens(
        Route calldata _route,
        address _tokenIn,
        address _tokenOut
    ) internal pure
    {
        uint256 swapsLength = _route.swaps.length;

        require(swapsLength > 0, "No swaps in route");
        require(_route.swaps[0].tokenIn == _tokenIn, "Input token does not match");
        require(_route.swaps[swapsLength - 1].tokenOut == _tokenOut, "Output token does not match");
    }

    function swapForTotalAmountOut(Route[] calldata _foundRoutes)
    internal returns(uint256 amountOut)
    {
        amountOut = 0;
        for (uint256 i = 0; i < _foundRoutes.length; ++i) {
            amountOut += swapOnOneRoute(_foundRoutes[i]);
        }
    }

    function swapOnOneRoute(Route calldata _route)
        internal returns(uint256 amountOut)
    {
        amountOut = _route.amountIn;

        for (uint256 i = 0; i < _route.swaps.length; ++i) {
            SwapStep memory swap = _route.swaps[i];

            // approve dex to spend amount
            // later think about to approve maxAmount to our dexes from rateX cotract
            IERC20(swap.tokenIn).approve(dexes[swap.dexId], amountOut);

            // remove amount out min from 0
            amountOut = IDex(dexes[swap.dexId]).swap(
                swap.poolId,
                swap.tokenIn,
                swap.tokenOut,
                amountOut,
                0,
                address(this) // send funds to main RateX contract
            );
        }
    }
}
