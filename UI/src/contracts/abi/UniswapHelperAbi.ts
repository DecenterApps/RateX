export const UniswapHelperAbi = [{"inputs":[{"internalType":"address","name":"_pool","type":"address"},{"internalType":"address","name":"_tokenIn","type":"address"},{"internalType":"address","name":"_tokenOut","type":"address"},{"internalType":"uint256","name":"_amountIn","type":"uint256"}],"name":"estimateAmountOut","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"_pools","type":"address[]"},{"internalType":"uint256","name":"_numOfTicks","type":"uint256"}],"name":"fetchData","outputs":[{"components":[{"components":[{"internalType":"address","name":"pool","type":"address"},{"internalType":"address","name":"token0","type":"address"},{"internalType":"address","name":"token1","type":"address"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"int128","name":"tickLiquidityNet","type":"int128"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"uint128","name":"liquidity","type":"uint128"}],"internalType":"struct IUniswapState.PoolInfo","name":"info","type":"tuple"},{"components":[{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"bool","name":"initialized","type":"bool"},{"internalType":"int128","name":"liquidityNet","type":"int128"}],"internalType":"struct IUniswapState.TickData[]","name":"zeroForOneTicks","type":"tuple[]"},{"components":[{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"bool","name":"initialized","type":"bool"},{"internalType":"int128","name":"liquidityNet","type":"int128"}],"internalType":"struct IUniswapState.TickData[]","name":"oneForZeroTicks","type":"tuple[]"}],"internalType":"struct IUniswapState.PoolData[]","name":"poolData","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_pool","type":"address"},{"internalType":"uint256","name":"_numOfTicks","type":"uint256"}],"name":"fetchPoolData","outputs":[{"components":[{"components":[{"internalType":"address","name":"pool","type":"address"},{"internalType":"address","name":"token0","type":"address"},{"internalType":"address","name":"token1","type":"address"},{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"int128","name":"tickLiquidityNet","type":"int128"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"},{"internalType":"uint128","name":"liquidity","type":"uint128"}],"internalType":"struct IUniswapState.PoolInfo","name":"info","type":"tuple"},{"components":[{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"bool","name":"initialized","type":"bool"},{"internalType":"int128","name":"liquidityNet","type":"int128"}],"internalType":"struct IUniswapState.TickData[]","name":"zeroForOneTicks","type":"tuple[]"},{"components":[{"internalType":"int24","name":"tick","type":"int24"},{"internalType":"bool","name":"initialized","type":"bool"},{"internalType":"int128","name":"liquidityNet","type":"int128"}],"internalType":"struct IUniswapState.TickData[]","name":"oneForZeroTicks","type":"tuple[]"}],"internalType":"struct IUniswapState.PoolData","name":"","type":"tuple"}],"stateMutability":"view","type":"function"}]