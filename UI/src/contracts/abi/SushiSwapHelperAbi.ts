export const SushiSwapHelperAbi = [{"inputs":[{"components":[{"internalType":"address","name":"poolId","type":"address"},{"internalType":"string","name":"dexId","type":"string"},{"components":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"uint256","name":"decimals","type":"uint256"},{"internalType":"string","name":"name","type":"string"}],"internalType":"struct SushiSwapHelper.Token[]","name":"tokens","type":"tuple[]"}],"internalType":"struct SushiSwapHelper.PoolInfo[]","name":"poolsInfo","type":"tuple[]"}],"name":"getPoolsData","outputs":[{"components":[{"internalType":"address","name":"poolId","type":"address"},{"internalType":"string","name":"dexId","type":"string"},{"components":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"uint256","name":"decimals","type":"uint256"},{"internalType":"string","name":"name","type":"string"}],"internalType":"struct SushiSwapHelper.Token[]","name":"tokens","type":"tuple[]"},{"internalType":"uint256[]","name":"reserves","type":"uint256[]"}],"internalType":"struct SushiSwapHelper.SushiSwapV2Pool[]","name":"pools","type":"tuple[]"}],"stateMutability":"view","type":"function"}]