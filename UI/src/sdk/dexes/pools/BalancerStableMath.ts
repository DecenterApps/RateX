// Ported from Solidity:
// https://github.com/balancer-labs/balancer-core-v2/blob/70843e6a61ad11208c1cfabf5cfe15be216ca8d3/pkg/pool-stable/contracts/StableMath.sol

import { Token, Pool } from '../../types'
import BigNumber from "bignumber.js"
import * as fp from "../../utils/math/fixed-points"
import * as math from "../../utils/math/math"

const AMP_PRECISION = new BigNumber(1000)

export class BalancerPool extends Pool {

    reserves: BigNumber[]
    fee: BigNumber
    amplificationCoeff: BigNumber,
	balances: BigNumber[],
	weights: BigNumber[],
	swapFeePercentage: BigNumber,
  
    protected constructor(poolId: string, dexId: string, tokens: Token[], reserves: BigNumber[], fee: string, A: string) {
      	super(poolId, dexId, tokens)
      	this.reserves = reserves
      	this.fee = new BigNumber(fee)
      	this.amplificationCoeff = new BigNumber(A)
    }
  
    calculateExpectedOutputAmount(tokenIn: string, tokenOut: string, amountIn: bigint): bigint {
      	return calculateOutputAmount(this, tokenIn, tokenOut, BigNumber(amountIn.toString()))
    }
}

/* Computes how many tokens can be taken out of a pool if `tokenAmountIn` are sent, given the current balances.
  The amplification parameter equals: A n^(n-1)
  *************************************************************************************************************
  // outGivenIn token x for y - polynomial equation to solve                                                   //
  // ay = amount out to calculate                                                                              //
  // by = balance token out                                                                                    //
  // y = by - ay (finalBalanceOut)                                                                             //
  // D = invariant                                               D                     D^(n+1)                 //
  // A = amplification coefficient               y^2 + ( S - ----------  - D) * y -  ------------- = 0         //
  // n = number of tokens                                    (A * n^n)               A * n^2n * P              //
  // S = sum of final balances but y                                                                           //
  // P = product of final balances but y                                                                       //
  **************************************************************************************************************/
function calculateOutputAmount(pool: BalancerPool, tokenA: string, tokenB: string, tokenAmountIn: BigNumber, swapFeePercentage?: BigNumber): bigint {

	// Get the index of the token we are swapping from and to
    const i = pool.tokens.findIndex(token => token.address === tokenA)
    const j = pool.tokens.findIndex(token => token.address === tokenB)

	// Subtract the fee from the amount in if requested
	if (swapFeePercentage) 
		tokenAmountIn = fp.sub(tokenAmountIn, fp.mulUp(tokenAmountIn, swapFeePercentage))

	// Given that we need to have a greater final balance out, the invariant needs to be rounded up
	const invariant = _calculateInvariant(pool.amplificationCoeff, pool.reserves, true);
	pool.reserves[i] = fp.add(pool.reserves[i], tokenAmountIn);

	const finalBalanceOut = _getTokenBalanceGivenInvariantAndAllOtherBalances(
		pool.amplificationCoeff,
		pool.reserves,
		invariant,
		j
	)

	pool.reserves[i] = fp.sub(pool.reserves[i], tokenAmountIn)
	const res = fp.sub(fp.sub(pool.reserves[j], finalBalanceOut), math.ONE)
	return BigInt(res.toFixed())
}

// This function calculates the balance of a given token (tokenIndex) given all the other balances and the invariant
// Rounds result up overall
function _getTokenBalanceGivenInvariantAndAllOtherBalances(amplificationParameter: BigNumber, balances: BigNumber[], invariant: BigNumber, tokenIndex: number): BigNumber {
	
	const numTokens = new BigNumber(balances.length)
	const ampTimesTotal = math.mul(amplificationParameter, numTokens)
	let sum = balances[0]
	let P_D = math.mul(numTokens, balances[0])

	for (let j = 1; j < balances.length; j++) {
		P_D = math.divDown(
			math.mul(math.mul(P_D, balances[j]), numTokens),
			invariant
			)
		sum = fp.add(sum, balances[j])
	}

	sum = fp.sub(sum, balances[tokenIndex])
	const inv2 = math.mul(invariant, invariant)

	// We remove the balance fromm c by multiplying it
	const c = math.mul(
		math.mul(math.divUp(inv2, math.mul(ampTimesTotal, P_D)), AMP_PRECISION),
		balances[tokenIndex]
	)
	const b = fp.add(
		sum,
		math.mul(math.divDown(invariant, ampTimesTotal), AMP_PRECISION)
	);

	// We iterate to find the balance
	// We multiply the first iteration outside the loop with the invariant to set the value of the initial approximation.
	let prevTokenBalance = math.ZERO
	let tokenBalance = math.divUp(fp.add(inv2, c), fp.add(invariant, b))

	for (let i = 0; i < 255; i++) {
		prevTokenBalance = tokenBalance
		tokenBalance = math.divUp(
			fp.add(math.mul(tokenBalance, tokenBalance), c),
			fp.sub(fp.add(math.mul(tokenBalance, math.TWO), b), invariant)
		)

		if (tokenBalance.gt(prevTokenBalance) && fp.sub(tokenBalance, prevTokenBalance).lte(math.ONE)) 
			return tokenBalance
		else if (fp.sub(prevTokenBalance, tokenBalance).lte(math.ONE))
			return tokenBalance
	}

	throw new Error("STABLE_GET_BALANCE_DIDNT_CONVERGE");
}

/* Computes the invariant given the current balances, using the Newton-Raphson approximation.
   The amplification parameter equals: A n^(n-1)
  /**********************************************************************************************
  // invariant                                                                                 //
  // D = invariant                                                  D^(n+1)                    //
  // A = amplification coefficient      A  n^n S + D = A D n^n + -----------                   //
  // S = sum of balances                                             n^n P                     //
  // P = product of balances                                                                   //
  // n = number of tokens                                                                      //
  **********************************************************************************************/
function _calculateInvariant(amplificationParameter: BigNumber, balances: BigNumber[], roundUp: boolean): BigNumber {

	let sum = math.ZERO
	let numTokens = new BigNumber(balances.length)
	for (let i = 0; i < balances.length; i++) 
	  sum = fp.add(sum, balances[i])
	
	if (sum.isZero()) 
	  return math.ZERO
	
	let prevInvariant = math.ZERO
	let invariant = sum
	let ampTimesTotal = math.mul(amplificationParameter, numTokens)
  
	for (let i = 0; i < 255; i++) {
		let P_D = math.mul(numTokens, balances[0])
		for (let j = 1; j < balances.length; j++) {
			const leftSide = math.mul(math.mul(P_D, balances[j]), numTokens)
			P_D = math.div(leftSide, invariant, roundUp)
		}
	  
		prevInvariant = invariant
		invariant = math.div(
			fp.add(
				math.mul(math.mul(numTokens, invariant), invariant),
				math.div(
					math.mul(math.mul(ampTimesTotal, sum), P_D),
					AMP_PRECISION,
					roundUp
				)
			),
			fp.add(
				math.mul(fp.add(numTokens, math.ONE), invariant),
				math.div(
					math.mul(fp.sub(ampTimesTotal, AMP_PRECISION), P_D),
					AMP_PRECISION,
					!roundUp
				)
			),
			roundUp
		)
  
		if (invariant.gt(prevInvariant) && fp.sub(invariant, prevInvariant).lte(math.ONE))
			return invariant
	  	else if (fp.sub(prevInvariant, invariant).lte(math.ONE))
		  	return invariant
	}
  
	throw new Error("STABLE_GET_BALANCE_DIDNT_CONVERGE");
}