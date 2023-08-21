import { parse } from 'graphql'
import { gql, request } from 'graphql-request'
import { DEXGraphFunctionality } from '../DEXGraphFunctionality'
import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { Token, Pool, PoolInfo } from '../types'
import BigNumber from 'bignumber.js'

// test queries on: https://thegraph.com/hosted-service/subgraph/messari/curve-finance-arbitrum

// used in the calculateExpectedOutputAmount() calculations
export class CurvePool extends Pool {

  reserves: BigNumber[]
  fee: BigNumber
  amplificationCoeff: BigNumber

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

export default class Curve implements DEXGraphFunctionality {

    endpoint = 'https://api.thegraph.com/subgraphs/name/messari/curve-finance-arbitrum'
    dexId = 'Curve'

    static initialize(): DEXGraphFunctionality {
        return new Curve()
    }

    async getTopPools(numPools: number): Promise<PoolInfo[]> {
      const poolsInfo: PoolInfo[] = []
      const queryResult = await request(this.endpoint, queryTopPools(numPools))
      queryResult.pairs.forEach((pool: any) => {
        poolsInfo.push(createPoolFromGraph(pool, this.dexId))
      })
  
      return poolsInfo
    }
  
    async getPoolsWithTokenPair(token1: string, token2: string, first: number): Promise<PoolInfo[]> {
      const poolsInfo: PoolInfo[] = []
      const queryResult = await request(this.endpoint, queryPoolsWithTokenPair(token1, token2, first))
      queryResult.pairs.forEach((pool: any) => {
        poolsInfo.push(createPoolFromGraph(pool, this.dexId))
      })
  
      return poolsInfo
    }
  
    async getPoolsWithToken(token: string, numPools: number): Promise<PoolInfo[]> {
      const poolsInfo: PoolInfo[] = []
      const queryResult = await request(this.endpoint, queryPoolsWithToken(token, numPools))
      queryResult.pairs.forEach((pool: any) => {
        poolsInfo.push(createPoolFromGraph(pool, this.dexId))
      })
  
      return poolsInfo
    }

}

function queryTopPools(numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
  {
      liquidityPools(orderBy: totalValueLockedUSD, orderDirection: desc, first: ${numPools}) {
        id
        inputTokenBalances
        inputTokens {
          id
          decimals
          name
          symbol
        }
      }
    }
  `)
}
  
function queryPoolsWithTokenPair(tokenA: string, tokenB: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  // query does not need an or because it is assumed that pools will have >= 2 tokens
  return parse(gql`
  {
      liquidityPools(orderBy: totalValueLockedUSD, orderDirection: desc, first: ${numPools},
        where: {
          and: [
              {inputTokens_: {id: "${tokenA.toLowerCase()}"}},
              {inputTokens_: {id: "${tokenB.toLowerCase()}"}}
          ]
        }
      ) {
        id
        inputTokenBalances
        inputTokens {
          id
          decimals
          name
          symbol
        }
      }
    }
  `)
}
  
function queryPoolsWithToken(token: string, numPools: number): TypedDocumentNode<any, Record<string, unknown>> {
  return parse(gql`
  {
      liquidityPools(orderBy: totalValueLockedUSD, orderDirection: desc, first: ${numPools},
        where: {inputTokens_: {id: "${token.toLowerCase()}"}}
      ) {
        id
        inputTokenBalances
        inputTokens {
          id
          decimals
          name
          symbol
        }
      }
    }
  `)
}

function createPoolFromGraph(jsonData: any, dexId: string): PoolInfo {

  const pool: PoolInfo = {
    poolId: jsonData.id,
    dexId: dexId,
    tokens: jsonData.inputTokens.map((token: any, index: any) => {
      return {
        address: token.id,
        decimals: token.decimals
      }
    })
  }
  return pool
}

function calculateOutputAmount(pool: CurvePool, tokenA: string, tokenB: string, dx: BigNumber): bigint {
  // Get the index of the token we are swapping from and to
  const i = pool.tokens.findIndex(token => token.address === tokenA)
  const j = pool.tokens.findIndex(token => token.address === tokenB)

  // Get the precision of the token with the most decimals
  const maxDecimals = Math.max(...pool.tokens.map(token => token.decimals))
  const precisions: BigNumber[] = pool.tokens.map(token => new BigNumber(10 ** (maxDecimals - token.decimals)))

  // token.amounts convert so it is to the same precision
  dx = dx.times(precisions[i])
  for(let k = 0; k < pool.tokens.length; k++)
      pool.reserves[k] = pool.reserves[k].times(precisions[k])
  
  // x = total amount of the i-th token in the pool with the additional amount dx
  const x  = pool.reserves[i].plus(dx)                                               //(pool.tokens[i].amount + dx) / precisions[i]
  const y = getYAfterSwap(pool, i, j, x, pool.amplificationCoeff) 
  let dy = (pool.reserves[j].minus(y).minus(1)).div(precisions[j])
  const fee = pool.fee.times(dy).div(10**10)
  const res = floor(dy.minus(fee))
  return BigInt(res.toFixed())                                                       
}

function getYAfterSwap(pool: CurvePool, i: number, j: number, x: BigNumber, amp: BigNumber): BigNumber {

  console.assert(i !== j, "i and j cannot be the same")
  console.assert(i < pool.tokens.length && i >= 0, "i is out of range")
  console.assert(j < pool.tokens.length && j >= 0, "j is out of range")

  // init params
  const N_COINS = pool.tokens.length
  const Ann = amp.times(N_COINS)
  const D = calculateDInvariant(pool, amp)
  let coeff = D 
  let currentX = new BigNumber(0)               //token amount associated with the current iteration in the loop
  let sum = new BigNumber(0)              
  let prevY = new BigNumber(0)

  for (let k = 0; k < N_COINS; k++) {
      // * precisions[k] again because decimal.js ignores trailing zeroes here...
      if (k === i) 
          currentX = x
      else if (k !== j) 
          currentX = pool.reserves[k]
      else
          continue

      // coeff = coeff * D / (currentX * N_COINS)
      sum = sum.plus(currentX)
      coeff = coeff.times(D).div(currentX.times(N_COINS))
  }

  coeff =  (coeff.times(D)).div(Ann.times(N_COINS))            // coeff * D / (Ann * N_COINS)  
  const b = sum.plus((D).div(Ann))                             // sum + D / Ann                     
  let y = D        

  // solve a quadratic equation for the value of y
  for (let k = 0; k < 255; k++) {
      prevY = y 
      //(y * y + coeff) / (2 * y + b - D) 
      let numerator = y.times(y).plus(coeff)  
      let denominator = y.times(2).plus(b).minus(D)
      y = numerator.div(denominator)
                                      
      // Equality with the precision of 1 wei
      const diff = prevY.minus(y).abs()
      if (diff.lte(1))                                
          break
  }

  console.error("Calculation did not converge")
  return floor(y)
}

function calculateDInvariant(pool: CurvePool, amp: BigNumber): BigNumber {

  // let sum: Decimal = tokens.reduce((sum, token) => sum.plus(token.amount), DecimalZero)
  let sum: BigNumber = new BigNumber(0)
  for(let res of pool.reserves)
      sum = sum.plus(res)
  
  let D: BigNumber = sum
  let prevD: BigNumber = new BigNumber(0)
  const nCoins = pool.tokens.length
  let Ann: BigNumber = amp.times(nCoins)

  if (sum.eq(BigNumber(0))) return new BigNumber(0)

  // converging to value D - typically occurs in 4 rounds or less
  for(let k = 0; k < 256; k++) {
    let D_P = D
    for (let res of pool.reserves) {
      const leftSide = D_P.times(D)
      const rightSide = (res.times(nCoins)).plus(1)                // +1 is to prevent /0
      D_P = leftSide.div(rightSide)                                //(D_P * D) / (t.amount * nCoins + bigintOne)                
    }

    prevD = D

    // D = (Ann * sum + D_P * nCoins) * D / ((Ann - 1) * D + (nCoins + 1) * D_P)
    const numeratorPart = Ann.times(sum).plus(D_P.times(nCoins))
    const denominatorPart1 = (Ann.minus(1)).times(D)
    const denominatorPart2 = D_P.times(nCoins + 1)
    const denominatorPart = denominatorPart1.plus(denominatorPart2)
    D = numeratorPart.times(D).dividedToIntegerBy(denominatorPart)

    // equality with the precision of 1 wei
    const diff = prevD.minus(D).abs()
    if (diff.lte(1))                                                     //diff <= DecimalOne
      break
  }

  return D
}

function floor(num: BigNumber): BigNumber {
  const whole = num.toFixed().toString().split(".")[0]
  return new BigNumber(whole)
}