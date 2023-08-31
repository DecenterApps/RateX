import {FoundQuote, Pool, Quote, ResponseType, Route} from '../types'
import { fetchPoolsData } from './graph_communication'
import { ERC20_ABI } from '../../contracts/abi/common/ERC20_ABI'
import initRPCProvider from '../../providers/RPCProvider'
import Web3 from 'web3'
import {TQuoteUniLike} from "../routing/uni_like_algo/types";
import { RateXContract } from '../../contracts/rateX/RateX'
import { findRouteUniLikeAlgo } from '../routing/uni_like_algo/main'
import {findRouteWithIterativeSplitting} from "../routing/iterative_spliting/main";

async function getQuoteIterativeSplittingAlgo(tokenA: string, tokenB: string, amountIn: bigint): Promise<Quote> {
  console.log('tokenIn: ', tokenA)
  console.log('tokenOut: ', tokenB)

  const pools: Pool[] = await fetchPoolsData(tokenA, tokenB, 5, 5)
  console.log('Fetched pools:', pools)

  return findRouteWithIterativeSplitting(tokenA, tokenB, amountIn, pools)
}

async function getBestQuoteUniLikeAlgo(tokenA: string, tokenB: string, amountIn: bigint) {
  const pools: Pool[] = await fetchPoolsData(tokenA, tokenB, 5, 5)
  console.log('Fetched pools:', pools)
  console.log('Pool size: ', pools.length)
  return findRouteUniLikeAlgo(tokenA, tokenB, amountIn, pools)
}

async function executeSwapWithSplitting(
    tokenIn: string,
    tokenOut: string,
    quote: FoundQuote,
    amountIn: bigint,
    minAmountOut: bigint,
    signer: string,
    chainId: number
): Promise<ResponseType> {
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
        .swapWithSplit(quote.routes, tokenIn, tokenOut, amountIn, minAmountOut, signer)
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
  getQuoteIterativeSplittingAlgo,
  getBestQuoteUniLikeAlgo,
  executeSwapWithSplitting
}
