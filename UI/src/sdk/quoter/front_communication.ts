import { Quote, ResponseType } from '../types'
import {executeSwapMultiHop, getBestQuoteMultiHop, getBestQuoteUniLikeAlgo} from './solidity_communication'
import {TQuoteUniLike} from "../routing/uni_like_algo/types";

async function initGetQuote(tokenA: string, tokenB: string, amountIn: bigint): Promise<Quote> {
  return getBestQuoteMultiHop(tokenA, tokenB, amountIn)
}

async function getQuoteUniLike(tokenA: string, tokenB: string, amountIn: bigint): Promise<TQuoteUniLike> {
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

  return await executeSwapMultiHop(token1, token2, quote, amountIn, minAmountOut, signer, chainId);
}

export { initGetQuote, swap, getQuoteUniLike }
