import {FoundQuote, Quote, ResponseType} from '../types'
import {getQuoteIterativeSplittingAlgo, executeSwapWithSplitting, getBestQuoteUniLikeAlgo} from './solidity_communication'
import {TQuoteUniLike} from "../routing/uni_like_algo/types";

async function getQuoteIterativeSplitting(tokenA: string, tokenB: string, amountIn: bigint): Promise<Quote> {
  return getQuoteIterativeSplittingAlgo(tokenA, tokenB, amountIn)
}

async function getQuoteUniLike(tokenA: string, tokenB: string, amountIn: bigint): Promise<FoundQuote> {
  return getBestQuoteUniLikeAlgo(tokenA, tokenB, amountIn);
}

async function swapWithSplitting(
    token1: string,
    token2: string,
    quote: FoundQuote,
    amountIn: bigint,
    slippagePercentage: number,
    signer: string,
    chainId: number
): Promise<ResponseType> {

  const amountOut = quote.quote;
  const slippageBigInt = BigInt(slippagePercentage * 100);
  const minAmountOut = (amountOut * (BigInt(100) - slippageBigInt)) / BigInt(100);

  return executeSwapWithSplitting(token1, token2, quote, amountIn, minAmountOut, signer, chainId);
}

export {
  getQuoteIterativeSplitting,
  getQuoteUniLike,
  swapWithSplitting
}
