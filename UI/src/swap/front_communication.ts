import { Quote, ResponseType } from '../types'
import { executeSwap } from './solidity_communication'
import { RateX, Dexes } from 'ratex-sdk'

async function findQuote(tokenIn: string, tokenOut: string, amountIn: bigint, chainId: number): Promise<Quote> {
  const rpcUrl = (chainId === 1 ? process.env.REACT_APP_MAINNET_URL : process.env.REACT_APP_ARBITRUM_URL) || ''
  const graphApiKey = process.env.REACT_APP_GRAPH_API_KEY || ''

  const rateX = new RateX({ rpcUrl, chainId, graphApiKey })
  const res = await rateX.getQuote(tokenIn, tokenOut, amountIn)

  return res
}

async function swap(
  token1: string,
  token2: string,
  quote: Quote,
  amountIn: bigint,
  slippagePercentage: number,
  signer: string,
  chainId: number,
  writeContractAsync: Function
): Promise<ResponseType> {
  const amountOut = quote.quote
  const slippageBigInt = BigInt(slippagePercentage * 100)
  const minAmountOut = (amountOut * (BigInt(100) - slippageBigInt)) / BigInt(100)

  return executeSwap(token1, token2, quote, amountIn, minAmountOut, signer, chainId, writeContractAsync)
}



export { findQuote, swap }
