export const CamelotHelperAbi = [{"inputs":[{"internalType":"address","name":"id","type":"address"}],"name":"getPoolInfo","outputs":[{"internalType":"uint112","name":"reserve0","type":"uint112"},{"internalType":"uint112","name":"reserve1","type":"uint112"},{"internalType":"uint16","name":"token0feePercent","type":"uint16"},{"internalType":"uint16","name":"token1FeePercent","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"poolId","type":"address"},{"internalType":"string","name":"dexId","type":"string"},{"components":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"uint256","name":"decimals","type":"uint256"}],"internalType":"struct CamelotHelper.Token[]","name":"tokens","type":"tuple[]"}],"internalType":"struct CamelotHelper.PoolInfo[]","name":"poolsInfo","type":"tuple[]"}],"name":"getPoolsData","outputs":[{"components":[{"internalType":"address","name":"poolId","type":"address"},{"internalType":"string","name":"dexId","type":"string"},{"components":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"uint256","name":"decimals","type":"uint256"}],"internalType":"struct CamelotHelper.Token[]","name":"tokens","type":"tuple[]"},{"internalType":"uint112[2]","name":"reserves","type":"uint112[2]"},{"internalType":"uint16[2]","name":"fees","type":"uint16[2]"},{"internalType":"bool","name":"stableSwap","type":"bool"}],"internalType":"struct CamelotHelper.CamelotPool[]","name":"pools","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"id","type":"address"}],"name":"getStableSwap","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]