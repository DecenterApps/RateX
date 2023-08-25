// Ported from Solidity:
// https://github.com/balancer/balancer-v2-monorepo/blob/master/pkg/pool-weighted/contracts/WeightedMath.sol

import { Token, Pool } from '../../../types'
import BigNumber from "bignumber.js"
import * as fp from "../../../utils/math/fixed-points"
import * as math from "../../../utils/math/math"

// Swap limits: amounts swapped may not be larger than this percentage of total balance.
const _MAX_IN_RATIO = new BigNumber(0.3e18)
const _MAX_OUT_RATIO = new BigNumber(0.3e18)

export class BalancerWeightedPool extends Pool {

    reserves: BigNumber[]
    weights: BigNumber[]
    
    protected constructor(poolId: string, dexId: string, tokens: Token[], reserves: BigNumber[], weights: BigNumber[]) {
      	super(poolId, dexId, tokens)
      	this.reserves = reserves
      	this.weights = weights
    }
  
    calculateExpectedOutputAmount(tokenIn: string, tokenOut: string, amountIn: bigint): bigint {
      	return calculateOutputAmount(this, tokenIn, tokenOut, BigNumber(amountIn.toString()))
    }
}

function calculateOutputAmount(pool: BalancerWeightedPool, tokenA: string, tokenB: string, tokenAmountIn: BigNumber, swapFeePercentage?: BigNumber): bigint {

	// Get the index of the token we are swapping from and to
    const i = pool.tokens.findIndex(token => token._address === tokenA)
    const j = pool.tokens.findIndex(token => token._address === tokenB)

    const res = _calcOutGivenIn(
        pool.reserves[i],
        pool.weights[i],
        pool.reserves[j],
        pool.weights[j],
        tokenAmountIn
    )

    return BigInt(res.toFixed())
}

// Computes how many tokens can be taken out of a pool if `amountIn` are sent, given the
// current balances and weights.
function _calcOutGivenIn(
    balanceIn: BigNumber,
    weightIn: BigNumber,
    balanceOut: BigNumber,
    weightOut: BigNumber,
    amountIn: BigNumber
): BigNumber {
    /**********************************************************************************************
    // outGivenIn                                                                                //
    // aO = amountOut                                                                            //
    // bO = balanceOut                                                                           //
    // bI = balanceIn              /      /            bI             \    (wI / wO) \           //
    // aI = amountIn    aO = bO * |  1 - | --------------------------  | ^            |          //
    // wI = weightIn               \      \       ( bI + aI )         /              /           //
    // wO = weightOut                                                                            //
    **********************************************************************************************/

    // Amount out, so we round down overall.

    // The multiplication rounds down, and the subtrahend (power) rounds up (so the base rounds up too).
    // Because bI / (bI + aI) <= 1, the exponent rounds down.

    // Cannot exceed maximum in ratio
    if(amountIn > fp.mulDown(balanceIn, _MAX_IN_RATIO)) {
        throw new Error("MAX_IN_RATIO")
    }

    const denominator = math.add(balanceIn, amountIn);
    const base = fp.divUp(balanceIn, denominator);
    const exponent = fp.divDown(weightIn, weightOut);
    const power = fp.powUp(base, exponent);

    return fp.mulDown(balanceOut, fp.complement(power))
}

// // Invariant is used to collect protocol swap fees by comparing its value between two times.
// // So we can round always to the same direction. It is also used to initiate the BPT amount
// // and, because there is a minimum BPT, we round down the invariant.
// function _calculateInvariant(normalizedWeights: BigNumber[], balances: BigNumber[]): BigNumber
// {
//     /**********************************************************************************************
//     // invariant               _____                                                             //
//     // wi = weight index i      | |      wi                                                      //
//     // bi = balance index i     | |  bi ^   = i                                                  //
//     // i = invariant                                                                             //
//     **********************************************************************************************/

//     let invariant = BigNumber(1)
//     for (let i = 0; i < normalizedWeights.length; i++) {
//         invariant = fp.mulDown(invariant, fp.powDown(balances[i], normalizedWeights[i]));
//     }

//     // _require(invariant > 0, Errors.ZERO_INVARIANT);
//     return invariant
// }