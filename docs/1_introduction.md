<div style='flex: 0.2; align="center"'>
<img src="images/rsz_decenter_logo.png"
        alt="decenter"
        style="max-width: 70%;" />
</div>

# Introduction
The purpose of this project was to create a decentralized open source DEX aggregator on Arbitrum.

## What is a DEX?
DEX is a decentralized exchange where users can trade token A for token B. DEXes have many pools and every pool can have 2 or more tokens. The price of a token depends on the ratios of all the 
tokens in the pool. Each DEX has mechanisms to determine how much token B they can give back for 
some input amount of token A. 

## What is a DEX aggregator?
Aggregators job is to find the best swap route so the output amount of token B is the highest possible. 
Each DEX usually has an internal router that only goes through the pools of that DEX. Best aggregators route through pools of numerous DEXes - current leaders are [0x](https://0x.org/products/swap) and [1inch](https://app.1inch.io/#/1/classic/swap/ETH). 

## Why Arbitrum?
Arbitrum is an L2 (layer 2) chain/network. L2 chains combine multiple tx (transaction) into one, and then send that one tx to an L1 network (so that tx is written into a block). There are 2 ways multiple txs are combined into one (sequencer and zero knowledge proofs). What this means for us, is that the gas cost of one tx on an L2 network will be significantly cheaper than if it were on L1. This gave us the freedom to focus on the routing algorithm.

## Why are we making this?
Current DEX aggregators do not charge any fees but do take the positive slippage, if there is one.
Slippage is the difference between the expected price of a trade and the price at which the trade is executed. Also, their routing algorithms are closed source, so if they suddenly started charging fees, they effectively have no immediate competition.

Our idea was to create the 'competition'. We would:
1. not take the positive slippage and fees
2. make the routing algorithm open source
3. create the code (SDK) executed on the user's machine (in browser), instead of a server

## How does the app find the best quote
1. We get basic pool information (addresses) from the Graph API (because we need top pools for each DEX we are supporting, but also top pools for each token in token pair that we are swapping). We decided to go with the Graph API because we need to sort the data by the TVL in our SDK (doing that on-chain has it's own complication - see the 3rd chapter).
2. Fetch additional pool information on-chain for each DEX (check helper contracts for more info).
3. Place that pool information into the routing algorithm to find the best route. Algorithm calculates swap 'amount out' off-chain, using on-chain Solidity calculations adjusted for Typescript (each DEX has a unique math behind it). Our SDK has 2 algorithms: 
    - Uni-like algorithm
    - Iterative DP (dynamic programming) algorithm
<br>
<b>_NOTE:_</b> Both algorithms have split functionalities.

4. Display the best route and execute swap

## Integrated DEXes
| Supported DEX                         | Arbitrum TVL ($) - 01.09.2023 |
|---------------------------------------|-------------------------------|
| Uniswap V3                            | 207.98 milion                 |
| Balancer (pools with weighted math)   | 85.46 milion                  |
| Camelot                               | 57.36 milion                  |
| Sushiswap V2                          | 42.09 milion                  |
| Curve                                 | 25.37 milion                  |

<b>_NOTE ON BALANCER:_</b> 
[Balancer pools](https://docs.balancer.fi/concepts/pools/more/deployments.html) implement 3 types of math:
1. Weighted (we support this)
2. Stable (we have **tried** to support this, feel free to correct the code so it can be integrated)
3. Linear (for Boosted pools - critical vulnerability on 22.08.2023. and all the liquidity has been withdrawn)
<br>
<div style="text-align:center">
  <img src="images/balancer_pools.png"
        alt="Results"
        style="max-width: 70%;" />
</div>
<br>

# Results
We have two algorithms for finding the best quote (more on them in later sections). Both of them showed competitive rates for different pairs of tokens and different amounts.

<br>
<div style="text-align:center">
  <img src="images/results.png"
        alt="Results"
        style="max-width: 250%;" />
</div>
<br>

# About the creators
Creators of RateX are interns at [Decenter](https://www.decenter.com/), Web3.0 company celebrated mostly for their product [DeFi Saver](https://defisaver.com/). Here's the list of the people that worked:

- [Rajko Zagorac](https://www.linkedin.com/in/rajko-zagorac/) 
- [Dragan Mitrasinovic](https://www.linkedin.com/in/dragan-mitrasinovic/)
- [Irina Tomic](https://www.linkedin.com/in/irina-tomi%C4%87-64b6b3247/)
- [Daniil Grbic](https://www.linkedin.com/in/daniilgrbic/)
- [Branko Grbic](https://www.linkedin.com/in/branko-grbic-857335193/)


Special thanks to:

- [Nikola Markovic](https://www.linkedin.com/in/nikolamarkovicnmz/) - mentoring the project
- [Konstantnin Jaredic](https://github.com/kjaredic), [Nebojsa Majkic](https://www.linkedin.com/in/nmajkic/) - mentoring the solidity part
- [Nikola Klipa](https://www.linkedin.com/in/nikolaklipa/) - mentoring the algorithm part
- [Nikola Vukovic](https://www.linkedin.com/in/nikola-vukovic/) - mentoring the UI and TypeScript part of the SDK

And every other [Decenter member](https://www.decenter.com/team/) helping the project come to life!
