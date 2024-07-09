import { Quote, ResponseType } from '../types'
import { executeSwap, getQuote } from './solidity_communication'
import Web3 from 'web3'
import { useGlobalState } from '../../context/GlobalStateProvider'
async function findQuote(tokenIn: string, tokenOut: string, amountIn: bigint, chainId: number, setRouteFindingStep: Function): Promise<Quote> {
  return getQuote(tokenIn, tokenOut, amountIn, chainId, setRouteFindingStep)
}

async function swap(
  token1: string,
  token2: string,
  quote: Quote,
  amountIn: bigint,
  slippagePercentage: number,
  signer: string,
  chainId: number,
): Promise<ResponseType> {
  
  const amountOut = quote.quote
  const slippageBigInt = BigInt(slippagePercentage * 100)
  const minAmountOut = (amountOut * (BigInt(100) - slippageBigInt)) / BigInt(100)

  console.log('Route....')
  for (let route of quote.routes) {
    console.log(route)
  }

  return executeSwap(token1, token2, quote, amountIn, minAmountOut, signer, chainId)
}

export { findQuote, swap }
