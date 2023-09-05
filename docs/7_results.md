# Results
We have two algorithms for finding quote. Both of them showed competitive rates for different pairs of tokens and different amounts.

For the first algorithm, the Uniswap like algo, it is important to note:
1. the testing was done without trading through pools with > 2 tokens (all of Balancer pools
and some Curve pools). That part of the algorithm was not completed in time.
2. In some cases, the quote is worse than the actual result of the trade. This is because
we fetch +- 15 ticks from the current tick for Uniswap V3 pools, so our code will sometimes
think that a pool does not have any more liquidity.

<br>
<div style="text-align:center">
  <img src="images/results.png"
        alt="Results"
        style="max-width: 250%;" />
</div>
<br>

### Execution time
For the second algorithm, it is important to note that the execution time without
Curve pools takes < 1 second (~ 300ms). But with Curve pools, that number is usually above 5 seconds, depending on the input amount. This is because Curve pools use Newton-Raphson method for it's calculations. 