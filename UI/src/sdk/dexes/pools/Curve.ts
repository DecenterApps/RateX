import { Token, Pool } from '../../types'
import BigNumber from 'bignumber.js'
import { sha256 } from 'js-sha256';

// Output amount calculations resource: https://atulagarwal.dev/posts/curveamm/stableswap/

// Hash map of D-invariants (calculateDInvariant can take up to 200ms)
let DInvariants = new Map<string, BigNumber>()

export class CurvePool extends Pool {
  reserves: BigNumber[]
  startingReserves: BigNumber[]
  fee: BigNumber
  amplificationCoeff: BigNumber

  constructor(poolId: string, dexId: string, tokens: Token[], reserves: BigNumber[], fee: string, A: string) {
    super(poolId, dexId, tokens)
    this.reserves = reserves
    this.startingReserves = [...this.reserves]
    this.fee = new BigNumber(fee)
    this.amplificationCoeff = new BigNumber(A)
  }

  reset(): void {
    this.reserves = [...this.startingReserves]
  }

  calculateExpectedOutputAmount(tokenIn: string, tokenOut: string, amountIn: bigint): bigint {
    return calculateOutputAmount(this, tokenIn, tokenOut, BigNumber(amountIn.toString()))
  }

  update(tokenIn: string, tokenOut: string, amountIn: bigint, amountOut: bigint): void {
    const i = this.tokens.findIndex((token) => token._address === tokenIn)
    const j = this.tokens.findIndex((token) => token._address === tokenOut)

    this.reserves[i] = this.reserves[i].plus(BigNumber(amountIn.toString()))
    this.reserves[j] = this.reserves[j].minus(BigNumber(amountOut.toString()))
  }
}

/*
  Equivalent to the function get_dy_underlying in Solidity SC for Curve pools
  @param pool: the pool in which the swap is happening
  @param tokenA: the address of the token we are swapping from
  @param tokenB: the address of the token we are swapping to
  @param dx: the amount of tokenA we are swapping (in wei)
*/
function calculateOutputAmount(pool: CurvePool, tokenA: string, tokenB: string, dx: BigNumber): bigint {
  // Get the index of the token we are swapping from and to
  const i = pool.tokens.findIndex((token) => token._address === tokenA)
  const j = pool.tokens.findIndex((token) => token._address === tokenB)

  // Get the precision of the token with the most decimals
  const maxDecimals = Math.max(...pool.tokens.map((token) => token.decimals))
  const precisions: BigNumber[] = pool.tokens.map((token) => new BigNumber(10 ** (maxDecimals - token.decimals)))

  // token.amounts: convert so it is to the same precision
  dx = dx.times(precisions[i])
  for (let k = 0; k < pool.tokens.length; k++) {
    pool.reserves[k] = pool.reserves[k].times(precisions[k])
  }

  // x = total amount of the i-th token in the pool with the additional amount dx
  const x = pool.reserves[i].plus(dx) //(pool.tokens[i].amount + dx) / precisions[i]
  const y = getYAfterSwap(pool, i, j, x, pool.amplificationCoeff)
  let dy = pool.reserves[j].minus(y).minus(1).div(precisions[j])
  const fee = pool.fee.times(dy).div(10 ** 10)
  const res = floor(dy.minus(fee))

  for (let k = 0; k < pool.tokens.length; k++) {
    pool.reserves[k] = pool.reserves[k].div(precisions[k])
  }

  return BigInt(res.toFixed())
}

/* 
  Calculate y = pool.tokens[j].amount if one makes pool.tokens[i].amount = x
  Done by solving quadratic equation iteratively.
  x_1**2 + x1 * (sum' - (A*n**n - 1) * D / (A * n**n)) = D ** (n + 1) / (n ** (2 * n) * prod' * A)
  x_1**2 + b*x_1 = c
  x_1 = (x_1**2 + c) / (2*x_1 + b)

  @param pool: the pool in which the swap is happening
  @param i: the index of the token we are swapping from
  @param j: the index of the token we are swapping to
  @param x: the amount of token i we are swapping (in wei)
  @param amp: the amplification coefficient of the pool (constant for every pool)
  @dev: all the amount are in the same precision (the one of the token with the most decimals)
*/
function getYAfterSwap(pool: CurvePool, i: number, j: number, x: BigNumber, amp: BigNumber): BigNumber {
  console.assert(i !== j, 'i and j cannot be the same')
  console.assert(i < pool.tokens.length && i >= 0, 'i is out of range')
  console.assert(j < pool.tokens.length && j >= 0, 'j is out of range')

  // check hash if it has already been calculated
  const hash = calculateYHash(pool, i, j, x, amp)
  if (DInvariants.has(hash))
    return DInvariants.get(hash) as BigNumber

  // init params
  const N_COINS = pool.tokens.length
  const Ann = amp.times(N_COINS)
  const D = calculateDInvariant(pool, amp)
  let coeff = D
  let currentX = new BigNumber(0) //token amount associated with the current iteration in the loop
  let sum = new BigNumber(0)
  let prevY = new BigNumber(0)

  for (let k = 0; k < N_COINS; k++) {
    // * precisions[k] again because decimal.js ignores trailing zeroes here...
    if (k === i) currentX = x
    else if (k !== j) currentX = pool.reserves[k]
    else continue

    sum = sum.plus(currentX)
    coeff = coeff.times(D).div(currentX.times(N_COINS)) // coeff = coeff * D / (currentX * N_COINS)
  }

  coeff = coeff.times(D).div(Ann.times(N_COINS)) // coeff * D / (Ann * N_COINS)
  const b = sum.plus(D.div(Ann)) // sum + D / Ann
  let y = new BigNumber(D)

  // solve a quadratic equation for the value of y
  for (let k = 0; k < 255; k++) {
    prevY = y
    let numerator = y.times(y).plus(coeff)
    let denominator = y.times(2).plus(b).minus(D)
    y = numerator.div(denominator) //(y * y + coeff) / (2 * y + b - D)

    // Equality with the precision of 1 wei
    const diff = prevY.minus(y).abs()
    if (diff.lte(1)) break
  }

  // set new hash and return y
  DInvariants.set(hash, y)
  return floor(y)
}

/* 
  D-invariant is used to ensure that the product of the balances of all tokens in the pool remains constant
  A * sum(x_i) * n**n + D = A * D * n**n + D**(n+1) / (n**n * prod(x_i))
  Converging solution: D[j+1] = (A * n**n * sum(x_i) - D[j]**(n+1) / (n**n prod(x_i))) / (A * n**n - 1)

  @param pool: the pool in which the swap is happening
  @param amp: the amplification coefficient of the pool (constant for every pool)
  @returns: the D-invariant of the pool
*/
function calculateDInvariant(pool: CurvePool, amp: BigNumber): BigNumber {

  // check hash if it has already been calculated
  const hash = calculateDHash(pool, amp)
  if (DInvariants.has(hash))
    return DInvariants.get(hash) as BigNumber

  // let sum: Decimal = tokens.reduce((sum, token) => sum.plus(token.amount), DecimalZero)
  let sum: BigNumber = new BigNumber(0)
  for (let res of pool.reserves) {
    sum = sum.plus(res)
  }

  let D: BigNumber = sum
  let prevD: BigNumber = new BigNumber(0)
  const nCoins = pool.tokens.length
  let Ann: BigNumber = amp.times(nCoins)

  if (sum.eq(BigNumber(0))) return new BigNumber(0)

  // converging to value D - typically occurs in 4 rounds or less
  for (let k = 0; k < 256; k++) {
    let D_P = D
    for (let res of pool.reserves) {
      const leftSide = D_P.times(D)
      const rightSide = res.times(nCoins).plus(1) // +1 is to prevent /0
      D_P = leftSide.div(rightSide) //(D_P * D) / (t.amount * nCoins + bigintOne)
    }

    prevD = D

    // D = (Ann * sum + D_P * nCoins) * D / ((Ann - 1) * D + (nCoins + 1) * D_P)
    const numeratorPart = Ann.times(sum).plus(D_P.times(nCoins))
    const denominatorPart1 = Ann.minus(1).times(D)
    const denominatorPart2 = D_P.times(nCoins + 1)
    const denominatorPart = denominatorPart1.plus(denominatorPart2)
    D = numeratorPart.times(D).dividedToIntegerBy(denominatorPart)

    // equality with the precision of 1 wei
    const diff = prevD.minus(D).abs()
    if (diff.lte(1)) break
  }

  // set new hash and return D
  DInvariants.set(hash, D)
  return D
}

// Sort reserves and append amp to the end of the array -> then hash
function calculateDHash(pool: CurvePool, amp: BigNumber): string {
  const values = sortLargeNumbers(pool.reserves)
  values.push(amp.toFixed().toString())
  const valuesString = values.join('')
  const hash = sha256(valuesString)
  return hash
}

function calculateYHash(pool: CurvePool, i: number, j: number, x: BigNumber, amp: BigNumber): string {
  const values = sortLargeNumbers(pool.reserves)
  values.push(i.toString())
  values.push(j.toString())
  values.push(x.toFixed().toString())
  values.push(amp.toFixed().toString())
  const valuesString = values.join('')
  const hash = sha256(valuesString)
  return hash
}

// sort in ascending order (basic bubble sort - has up to 3 tokens)
function sortLargeNumbers(arr: BigNumber[]): string[] {
  arr = [...arr]; // We shouldn't modify original array
  for (var i = 0; i < arr.length; i++) {
    for (var j = 0; j < (arr.length - i - 1); j++) {
      if (arr[j].gt(arr[j + 1])) {
        var temp = arr[j]
        arr[j] = arr[j + 1]
        arr[j + 1] = temp
      }
    }
  }
  return arr.map((v) => v.toFixed().toString())
}

/*
    Custom floor function because BigNumber library does not implement it
    @param num: the BigNumber number to be floored
*/
function floor(num: BigNumber): BigNumber {
  const whole = num.toFixed().toString().split('.')[0]
  return new BigNumber(whole)
}
