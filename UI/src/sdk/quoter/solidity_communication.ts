import { Pool, PoolEntry, PoolInfo, Quote, QuoteResultEntry, ResponseType, Route } from '../types'
import { fetchPoolsData } from './graph_communication'
import { ERC20_ABI } from '../../contracts/ERC20_ABI'
import initRPCProvider from '../../providers/RPCProvider'
import Web3 from 'web3'
import { RateXContract } from '../../contracts/RateX'
import { createGraph, multiHopSwap } from '../routing/multiHopSwap'

async function getBestQuoteMultiHop(tokenA: string, tokenB: string, amountIn: bigint): Promise<Quote> {
  const pools: Pool[] = await fetchPoolsData(tokenA, tokenB, 5, 5)
  console.log("Fetched pools:", pools);
  const graph = createGraph(pools)
  const route: Route = multiHopSwap(amountIn, tokenA, tokenB, graph)
  console.log("Route: ", route);
  return { routes: [route], amountOut: route.amountOut }
}

async function executeSwapMultiHop(
    tokenIn: string,
    tokenOut: string,
    quote: Quote,
    amountIn: bigint,
    minAmountOut: bigint,
    signer: string,
    chainId: number
) {
  const web3: Web3 = initRPCProvider(42161)
  const tokenInContract = new web3.eth.Contract(ERC20_ABI, tokenIn)

  //@ts-ignore
  const balance: bigint = await tokenInContract.methods.balanceOf(signer).call()

  if (balance < amountIn) {
    return { isSuccess: false, errorMessage: 'Insufficient balance' } as ResponseType
  }

  try {
    // @ts-ignore
    await tokenInContract.methods.approve(RateXContract.options.address, amountIn).send({ from: signer })

    let transactionHash: string = ''

    console.log("usao u swap");

    // @ts-ignore
    await RateXContract.methods //@ts-ignore
        .swapMultiHop(quote.routes[0], amountIn, minAmountOut, signer)
        .send({ from: signer })
        .on('transactionHash', function (hash: string) {
          transactionHash = hash
        })

    return { isSuccess: true, txHash: transactionHash } as ResponseType
  } catch (err: any) {
    return { isSuccess: false, errorMessage: err.message } as ResponseType
  }
}

export {
  getBestQuoteMultiHop,
  executeSwapMultiHop
}
