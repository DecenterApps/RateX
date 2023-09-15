# Solidity 

<b>RateX</b> has one main contract, found in `contracts/contracts/rateX/RateX.sol`, that will group all DEXes implemented and unify them trough interface (_each DEX would need to implement its `swap` function_). When calling for quote from SDK, RateX will have same functionalities for every DEX, making the developer not relying on specific DEX functionalities. <br>

Every DEX has it's own pool functionality needed for <b>calculating swap</b> (_Dex.sol_) and <b>retrieving pool info </b> (_Helper.sol_), so let's dive into each: <br>


## Uniswap V3

### Pool info
For every pool we need :
```
struct PoolInfo {
        address pool;
        address token0;
        address token1;
        int24 tick;
        int128 tickLiquidityNet;
        int24 tickSpacing;
        uint24 fee;
        uint160 sqrtPriceX96;
        uint128 liquidity;
    }
```
and
```
struct TickData {
    int24 tick;
    bool initialized;
    int128 liquidityNet;
}
```
`ZeroForOneTicks` and `OneForZero` ticks
<br><br>
We decided that <b>15 ticks</b> is optimal way for balancing speed and prize. Check `fetchPoolsData` in `UniswapHelper.sol` for more info.

### Swap
In swap function in `UniswapV3Dex.sol` we call `exactInputSingle` got from Uniswap router:
```
function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
```
<br>

## SushiSwap V2

### Pool info
We need to get reserves for each token pair. <br>
Check ```getPoolsData``` in `SushiSwapHelper.sol` for more info.

### Swap
Call selected function in [Sushi's router contract](https://arbiscan.io/address/0x1b02da8cb0d097eb8d57a175b88c7d8b47997506#writeContract), found in `SushiSwapDex.sol`: 
```
function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
) external returns (uint[] memory amounts);
```
<br>

## Curve 

### Pool info
We need to get `balances`, `A` and `fee`. <br>
Check `fetchPoolsData` in `CurveHelper.sol` for more info.

### Swap
Call `exchange()` function in Curve's pool address contract ([example](https://arbiscan.io/address/0x7f90122BF0700F9E7e1F688fe926940E8839F353#writeContract)):
```
function exchange(int128 i, int128 j, uint256 dx, uint256 min_dy, address to) external returns(uint256);
```
<br>

## Balancer
<b>_NOTE:_</b> We support only pools with weighted math

### Pool info
We need to return
```
uint8 decimals, uint256 invariant, address[] memory tokens, uint256[] memory balances, uint256[] memory weights, uint256 feePercentage
```
Every part of the data needed can be extracted using different method, so check `getWeightedPoolInfo` for more info in file `BalancerHelper.sol`

### Swap
We need to create structs `SingleSwap` (for pool and token info) `FundManagement` (for payment info).
Check `BalancerDex.sol` for more info. 

<br>

## Camelot

### Pool info
We need to get only reserves for additional info. Check `getPoolsData` in `CamelotHelper.sol`

### Swap
We call `swapExactTokensForTokensSupportingFeeOnTransferTokens` function in `CamelotDex.sol`:

```
function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        address refferer,
        uint256 deadline
    ) external;
```

<br>

# Test

Test for every DEX (and also RateX) can be found under `tests/` written in javascript. For testing our contracts, you should run:
```
npx hardhat test
```
or testing single contract
```angular2html
npx hardhat 'insert_file_name.js`
```

