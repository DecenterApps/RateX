import { Quote, ResponseType } from '../types'
import { executeSwap } from './solidity_communication'
import { RateX, Dexes } from 'ratex-sdk'

async function findQuote(tokenIn: string, tokenOut: string, amountIn: bigint, chainId: number): Promise<Quote> {
  const rpcUrl = process.env.REACT_APP_MAINNET_URL || ''
  const graphApiKey = process.env.REACT_APP_GRAPH_API_KEY || ''
  const dexes = [Dexes.SUSHISWAP_V2, Dexes.UNISWAP_V2, Dexes.UNISWAP_V3]

  const rateX = new RateX({ rpcUrl, chainId, dexes, graphApiKey })
  const res = await rateX.getQuote(tokenIn, tokenOut, amountIn)
  console.log(res)
  return res
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
