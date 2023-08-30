import { Pool, Quote, ResponseType, Route } from '../types'
import { fetchPoolsData } from './graph_communication'
import { ERC20_ABI } from '../../contracts/abi/common/ERC20_ABI'
import initRPCProvider from '../../providers/RPCProvider'
import Web3 from 'web3'
import { RateXContract } from '../../contracts/rateX/RateX'
import { createGraph, multiHopSwap } from '../routing/multiHopSwap'
import { findRoute } from '../routing/uni_like_algo/main'
import objectHash from 'object-hash'

async function getBestQuoteMultiHop(tokenA: string, tokenB: string, amountIn: bigint): Promise<Quote> {
  console.log('tokenIn: ', tokenA)
  console.log('tokenOut: ', tokenB)

  const pools: Pool[] = await fetchPoolsData(tokenA, tokenB, 5, 5)
  console.log('Fetched pools:', pools)
  const graph = createGraph(pools)
  console.log('Graph: ', graph)

  const poolMap: Map<string, Pool> = new Map<string, Pool>(pools.map((pool: Pool) => [pool.poolId, pool]))
  const routes: Map<string, Route> = new Map<string, Route>()
  let amountOut: bigint = BigInt(0)
  const step: number = 5
  const splitAmountIn: bigint = (amountIn * BigInt(step)) / BigInt(100)

  for (let i = 0; i < 100; i += step) {
    const route: Route = multiHopSwap(splitAmountIn, tokenA, tokenB, graph)
    const routeHash = objectHash(route.swaps)

    let existingRoute: Route | undefined = routes.get(routeHash)
    if (!existingRoute) {
      route.percentage = step
      routes.set(routeHash, route)
    } else {
      existingRoute.percentage += step
    }

    amountOut += route.amountOut
    updatePoolsInRoute(poolMap, route, splitAmountIn)
  }

  let quote: Quote = { routes: [], amountOut: amountOut }
  for (let route of routes.values()) {
    quote.routes.push(route)
  }

  return quote
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

    quote = transformQuoteForSolidity(quote)

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

// change poolId to address if bytes32 and remove token names if they exist
// If the address is lengths of 66 (byte32) then convert to address
function transformQuoteForSolidity(quote: Quote): Quote {
  quote.routes[0].swaps.map((swap) => {
    // console.log(swap.poolId)
    if (swap.poolId.length === 66) {
      // convert to address
      swap.poolId = swap.poolId.slice(0, 42)
    }
    // console.log(swap.poolId)
    delete swap.tokenAName
    delete swap.tokenBName
    return swap
  })

  return quote
}



async function getBestQuoteUniLikeAlgo(tokenA: string, tokenB: string, amountIn: bigint) {
  const pools: Pool[] = await fetchPoolsData(tokenA, tokenB, 5, 5)
  console.log('Fetched pools:', pools)
  console.log('Pool size: ', pools.length)
  return findRoute(tokenA, tokenB, amountIn, pools)
}

function updatePoolsInRoute(poolMap: Map<string, Pool>, route: Route, amountIn: bigint): void {
  for (let swap of route.swaps) {
    const pool: Pool | undefined = poolMap.get(swap.poolId)
    if (!pool) {
      console.log('Pool ', swap.poolId, " doesn't exist!")
      continue
    }

    const amountOut: bigint = pool.calculateExpectedOutputAmount(swap.tokenA, swap.tokenB, amountIn)
    pool.update(swap.tokenA, swap.tokenB, amountIn, amountOut)
    amountIn = amountOut
  }
}

export { getBestQuoteMultiHop, executeSwapMultiHop, getBestQuoteUniLikeAlgo }
