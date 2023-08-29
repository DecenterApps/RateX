import { Pool, Quote, ResponseType, Route } from '../types'
import { fetchPoolsData } from './graph_communication'
import { ERC20_ABI } from '../../contracts/ERC20_ABI'
import initRPCProvider from '../../providers/RPCProvider'
import Web3 from 'web3'
import { RateXContract } from '../../contracts/RateX'
import { createGraph, multiHopSwap } from '../routing/multiHopSwap'
import { findRoute } from '../routing/uni_like_algo/main'

async function getBestQuoteMultiHop(tokenA: string, tokenB: string, amountIn: bigint): Promise<Quote> {
  console.log('tokenIn: ', tokenA)
  console.log('tokenOut: ', tokenB)

  const pools: Pool[] = await fetchPoolsData(tokenA, tokenB, 5, 5)
  console.log('Fetched pools:', pools)
  const graph = createGraph(pools)
  console.log('Graph: ', graph)

  const poolMap: Map<string, Pool> = new Map<string, Pool>(pools.map((pool: Pool) => [pool.poolId, pool]))
  const routes: Map<Route, number> = new Map<Route, number>()
  let amountOut: bigint = BigInt(0)
  const step: number = 5
  const splitAmountIn: bigint = (amountIn * BigInt(step)) / BigInt(100)

  for (let i = 0; i < 100; i += step) {
    const route: Route = multiHopSwap(splitAmountIn, tokenA, tokenB, graph)
    routes.set(route, (routes.get(route) || 0) + step)
    amountOut += route.amountOut
    updatePoolsInRoute(poolMap, route, splitAmountIn)
  }

  console.log(routes)

  const route: Route = multiHopSwap(amountIn, tokenA, tokenB, graph)
  console.log('Route: ', route)
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

async function getBestQuoteUniLikeAlgo(tokenA: string, tokenB: string, amountIn: bigint) {
  const pools: Pool[] = await fetchPoolsData(tokenA, tokenB, 5, 5)
  console.log('Fetched pools:', pools)
  console.log('Pool size: ', pools.length)
  return findRoute(tokenA, tokenB, amountIn, pools)
}

function updatePoolsInRoute(poolMap: Map<string, Pool>, route: Route, amount: bigint): void {
  for (let swap of route.swaps) {
    const pool: Pool | undefined = poolMap.get(swap.poolId)
    if (!pool) {
      console.log('Pool ', swap.poolId, " doesn't exist!")
      continue
    }

    pool.update(swap.tokenA, swap.tokenB, amount)
    amount = pool.calculateExpectedOutputAmount(swap.tokenA, swap.tokenB, amount)
  }
}

export { getBestQuoteMultiHop, executeSwapMultiHop, getBestQuoteUniLikeAlgo }
