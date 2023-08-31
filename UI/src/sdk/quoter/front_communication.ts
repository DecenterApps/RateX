import { Quote, ResponseType } from '../types'
import {executeSwapMultiHop, getQuoteIterativeSplittingAlgo, getBestQuoteUniLikeAlgo} from './solidity_communication'
import {TQuoteUniLike} from "../routing/uni_like_algo/types";

/* Called by the UI to get the best quote for a swap
*  First we call Solidity to get additional Pools data
*  Then we call the iterative splitting algorithm to find the best route
*/
async function getQuoteIterativeSplitting(tokenA: string, tokenB: string, amountIn: bigint): Promise<Quote> {
  return getQuoteIterativeSplittingAlgo(tokenA, tokenB, amountIn)
}

// Called by the UI to get the best quote for a swap
//  Then we call the uni-like algorithm to find the best route (based on the Uniswap V3)
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

export { getQuoteIterativeSplitting, swap, getQuoteUniLike }
