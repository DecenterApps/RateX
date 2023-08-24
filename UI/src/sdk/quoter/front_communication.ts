import { Quote, ResponseType } from '../types'
import { getBestQuoteMultiHop } from './solidity_communication'

async function initGetQuote(tokenA: string, tokenB: string, amountIn: bigint): Promise<Quote> {
  return getBestQuoteMultiHop(tokenA, tokenB, amountIn)
}

async function swap(
  token1: string,
  token2: string,
  quote: Quote,
  amountIn: bigint,
  slippagePercentage: number,
  signer: string,
  chainId: number
): Promise<ResponseType> {
  // const amountOut = quote.amountOut
  // const slippageBigInt = BigInt(slippagePercentage * 100)
  // const minAmountOut = (amountOut * (BigInt(100) - slippageBigInt)) / BigInt(100)
  //
  // return executeSwap(token1, token2, quote, amountIn, minAmountOut, signer, chainId)
  return { isSuccess: true, txHash: '123', errorMessage: '' }
}

export { initGetQuote, swap }
