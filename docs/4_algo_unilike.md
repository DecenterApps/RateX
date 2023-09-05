# Uni-like algorithm
This algorithm is inspired by the Uniswap routing algorithm found [here](https://github.com/Uniswap/smart-order-router). The difference between the two is that instead of sendind the possible routes on-chain to get the 'output amount' of a swap (by executing and reverting the transaction), we calculate the 'output amount' off-chain. For this, we have off-chain calculations for every DEX (seen in sdk/dexes/pools). 

## How it works
0. Fetch pools:
    1. top N pools for tokenFrom and tokenTo are fetched from each DEX
    2. top N pools by TVL from each DEX
    3. top N pools that contain tokenFrom and tokenTo from each DEX (for a  possible direct swap)
1. Find all possible routes from token `A` to token `B` (basic backtracking algorithm).
2. Take a percentage (we are using step = 2%). Calculate output amount for every route (off-chain), for every possible input amount (from step to 100%, each time incrementing by step - e.g. 2% -> 2%, 4%, 6%... 98%, 100%).
3. Combine routes to find best combination (using deque data structure). 
    - When we find best route and we see that we don't have 100% of input amount spent yet, we put that result back in dequeue from which we discover next best amount out and repeat process.
    - We do NOT go through the same pool twice (we are not updating pool states)

<div style="text-align:center">
<img src="images/algo_uni.png"
        alt="UniLike algorithm"
        style="max-width: 200%;" />
</div>