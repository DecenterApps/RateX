import { Quote, ResponseType } from '../types'
import {executeSwapMultiHop, getBestQuoteMultiHop, getBestQuoteUniLikeAlgo} from './solidity_communication'

async function initGetQuote(tokenA: string, tokenB: string, amountIn: bigint): Promise<Quote> {
  return getBestQuoteMultiHop(tokenA, tokenB, amountIn)
}

async function getQuoteUniLike(tokenA: string, tokenB: string, amountIn: bigint): Promise<void> {
  return getBestQuoteUniLikeAlgo(tokenA, tokenB, amountIn);
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

  const amountOut = quote.amountOut;
  const slippageBigInt = BigInt(slippagePercentage * 100);
  const minAmountOut = (amountOut * (BigInt(100) - slippageBigInt)) / BigInt(100);

  return executeSwapMultiHop(token1, token2, quote, amountIn, minAmountOut, signer, chainId);
}

export { initGetQuote, swap, getQuoteUniLike }
