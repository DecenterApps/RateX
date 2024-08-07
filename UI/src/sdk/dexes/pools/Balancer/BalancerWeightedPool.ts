// Ported from Solidity: https://github.com/balancer/balancer-v2-monorepo/blob/master/pkg/pool-weighted/contracts/WeightedMath.sol

import { Token, Pool } from '../../../types'
import BigNumber from 'bignumber.js'
import * as fp from '../../../utils/math/fixed-points'
import * as math from '../../../utils/math/math'

// Swap limits: amounts swapped may not be larger than this percentage of total balance of the token being swapped
// Example - if the pool has 100 WETH, we can swap a maximum od 30 WETH
const _MAX_IN_RATIO = new BigNumber(0.3e18)

export class BalancerWeightedPool extends Pool {
  reserves: BigNumber[]
  startingReserves: BigNumber[]
  weights: BigNumber[]
  swapFeePercentage: BigNumber

  constructor(poolId: string, dexId: string, tokens: Token[], reserves: BigInt[], weights: BigInt[], swapFeePercentage: BigInt) {
    super(poolId, dexId, tokens)
    this.reserves = reserves.map((r: BigInt) => new BigNumber(r.toString()))
    this.startingReserves = [...this.reserves]
    this.weights = weights.map((r: BigInt) => new BigNumber(r.toString()))
    this.swapFeePercentage = new BigNumber(swapFeePercentage.toString())
  }

  reset(): void {
    this.reserves = [...this.startingReserves]
  }

  calculateExpectedOutputAmount(tokenIn: string, tokenOut: string, amountIn: bigint): bigint {
    return calculateOutputAmount(this, tokenIn, tokenOut, BigNumber(amountIn.toString()))
  }

  update(tokenIn: string, tokenOut: string, amountIn: bigint, amountOut: bigint): void {
    // CHECK ???
    const i = this.tokens.findIndex((token) => token._address === tokenIn)
    const j = this.tokens.findIndex((token) => token._address === tokenOut)

    this.reserves[i] = fp.add(this.reserves[i], BigNumber(amountIn.toString()))
    this.reserves[j] = fp.sub(this.reserves[j], BigNumber(amountOut.toString()))
  }
}

function calculateOutputAmount(
  pool: BalancerWeightedPool,
  tokenA: string,
  tokenB: string,
  tokenAmountIn: BigNumber,
  swapFeePercentage?: BigNumber
): bigint {
  // Subtract the fee from the amount in if requested
  if (swapFeePercentage) tokenAmountIn = fp.sub(tokenAmountIn, fp.mulUp(tokenAmountIn, swapFeePercentage))

  // Get the index of the token we are swapping from and to
  const i = pool.tokens.findIndex((token) => token._address === tokenA)
  const j = pool.tokens.findIndex((token) => token._address === tokenB)

  try {
    const res = _calcOutGivenIn(pool.reserves[i], pool.weights[i], pool.reserves[j], pool.weights[j], tokenAmountIn)
    return BigInt(res.toFixed())
  } catch (e) {
    return BigInt(0)
  }
}

/* Computes how many tokens can be taken out of a pool if `amountIn` are sent, given the current balances and weights.
    Amount out, so we round down overall:
**********************************************************************************************
// outGivenIn                                                                                //
// aO = amountOut                                                                            //
// bO = balanceOut                                                                           //
// bI = balanceIn              /      /            bI             \    (wI / wO) \           //
// aI = amountIn    aO = bO * |  1 - | --------------------------  | ^            |          //
// wI = weightIn               \      \       ( bI + aI )         /              /           //
// wO = weightOut                                                                            //
**********************************************************************************************
The multiplication rounds down, and the subtrahend (power) runds up (so the base rounds up too).
Because bI / (bI + aI) <= 1, the exponent rounds down.  */
// Ovde puca!!!!!!!!!!!!!!
function _calcOutGivenIn(
  balanceIn: BigNumber,
  weightIn: BigNumber,
  balanceOut: BigNumber,
  weightOut: BigNumber,
  amountIn: BigNumber
): BigNumber {
  // Cannot exceed maximum in ratio (30% of tokenIn balance)
  if (amountIn.gte(fp.mulDown(balanceIn, _MAX_IN_RATIO))) throw new Error('MAX_IN_RATIO')

  const denominator = math.add(balanceIn, amountIn)
  const base = fp.divUp(balanceIn, denominator)
  const exponent = fp.divDown(weightIn, weightOut)
  const power = fp.powUp(base, exponent)

  return fp.mulDown(balanceOut, fp.complement(power))
}
