// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDex.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SushiSwapDex.sol";
import "hardhat/console.sol";

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

    constructor(address _sushiSwapDexAddress, address _uniswapV3DexAddress){
        dexes["SUSHI_V2"] = _sushiSwapDexAddress;
        dexes["UNI_V3"] = _uniswapV3DexAddress;
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


    /////////////// code for route with split //////////////////////

    struct Token {
        address _address;
        uint256 decimals;
    }

    struct Pool {
        address poolId;
        string dexId;
        Token[] tokens;
    }

    struct TRoute {
        Pool[] pools;
        address tokenIn;
        address tokenOut;
    }

    struct AmountPercentage {
        uint256 amountIn;
        uint256 percentage;
    }

    struct TRouteWithQuote {
        TRoute route;
        uint256 quote;
        AmountPercentage amount;
    }

    struct SplitRoute {
        TRouteWithQuote[] routes;
        uint256 quote;
    }


    function swapWithSplit(
        SplitRoute calldata _splitRoute,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _quotedAmountWithSlippage,
        address _recipient
    )
    external returns(uint256 amountOut)
    {
        require(_splitRoute.routes.length > 0, "No routes in split route");
        checkAmountIn(_splitRoute, _amountIn);
        checkInputToken(_splitRoute, _tokenIn);
        checkOutputToken(_splitRoute, _tokenOut);

        // send funds from user to main contract
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);

        uint256 balanceBefore = IERC20(_tokenOut).balanceOf(address(this));
        amountOut = swapForTotalAmountOut(_splitRoute);
        uint256 balanceAfter = IERC20(_tokenOut).balanceOf(address(this));

        require(balanceAfter - balanceBefore == amountOut, "Amount out does not match");
        require(amountOut >= _quotedAmountWithSlippage, "Amount lesser than min amount");

        IERC20(_tokenOut).transfer(_recipient, amountOut);

        emit SwapEvent(_tokenIn, _tokenOut, _amountIn, amountOut, _recipient);
    }

    function swapForTotalAmountOut(SplitRoute calldata _splitRoute)
        internal returns(uint256 amountOut)
    {
        amountOut = 0;
        for (uint256 i = 0; i < _splitRoute.routes.length; ++i) {
            amountOut += swapOnOneRoute(_splitRoute.routes[i]);
        }
    }

    function checkAmountIn(
        SplitRoute calldata _splitRoute,
        uint256 _amountIn
    ) internal pure {
        uint amountIn = 0;
        for (uint256 i = 0; i < _splitRoute.routes.length; ++i) {
            amountIn += _splitRoute.routes[i].amount.amountIn;
        }
        require(amountIn == _amountIn, "Amount in does not match");
    }

    function checkInputToken(
        SplitRoute calldata _splitRoute,
        address _tokenIn
    ) internal pure {
        for (uint256 i = 0; i < _splitRoute.routes.length; ++i) {
            require(_splitRoute.routes[i].route.tokenIn == _tokenIn, "Input token does not match");
        }
    }

    function checkOutputToken(
        SplitRoute calldata _splitRoute,
        address _tokenOut
    ) internal pure {
        for (uint256 i = 0; i < _splitRoute.routes.length; ++i) {
            require(_splitRoute.routes[i].route.tokenOut == _tokenOut, "Output token does not match");
        }
    }

    function swapOnOneRoute(TRouteWithQuote calldata _routeWithQuote)
        internal returns(uint256 amountOut)
    {
        Pool[] memory pools = _routeWithQuote.route.pools;
        address tokenIn = _routeWithQuote.route.tokenIn;
        amountOut = _routeWithQuote.amount.amountIn;

        for (uint256 i = 0; i < pools.length; ++i) {
            Pool memory pool = pools[i];

            address tokenOut = pool.tokens[0]._address == tokenIn
                ? pool.tokens[1]._address
                : pool.tokens[0]._address;

            amountOut = executeSingleSwapOnPool(
                pools[i],
                tokenIn,
                tokenOut,
                amountOut
            );

            tokenIn = tokenOut;
        }
    }

    function executeSingleSwapOnPool(
        Pool memory _pool,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    )
    internal returns(uint256 amountOut)
    {
        // approve to dex contract to spend amountIn
        IERC20(_tokenIn).approve(dexes[_pool.dexId], _amountIn);

        amountOut = IDex(dexes[_pool.dexId]).swap(
            _pool.poolId,
            _tokenIn,
            _tokenOut,
            _amountIn,
            0,
            address(this)
        );
    }

}
