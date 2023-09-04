# Introduction
The purpose of this project was to create a decentralized open source DEX aggregator on Arbitrum.

## What is a DEX?
DEX is a decentralized exchange where users can trade token A for token B. DEXes consist of many 
pools. A pool can have 2 or more tokens. The price of a token depends on the ratios of all the 
tokens in the pool. Each DEX has mechanisms to determine how much token B they can give back for 
some input amount of token A. 

## What is a DEX aggregator?
Aggregators job is to find the best swap route so the output amount of token B highest possible. 
Each DEX usually has an internal router that only goes through the pools of that DEX. True aggregators
route through pools of numerous DEXes. The best DEX aggregators are [0x](https://0x.org/products/swap) and [1inch](https://app.1inch.io/#/1/classic/swap/ETH). 

## Why are we making this?
Current DEX aggregators do not charge any fees but do take the positive slippage, if there is one.
Slippage is the difference between the expected price of a trade and the price at which the trade is 
executed. Also, their routing algorithms are closed source so if they suddenly started charging fees they
effectively have no immediate competition.

Our idea was to create the 'competition'. We would:
1. not take the positive slippage
2. open source routing algorithm
3. the code executed on the user's machine, in browser, instead of a server