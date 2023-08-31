import { Pool, Quote, ResponseType } from '../types'
import { fetchPoolsData } from './graph_communication'
import { ERC20_ABI } from '../../contracts/abi/common/ERC20_ABI'
import initRPCProvider from '../../providers/RPCProvider'
import Web3 from 'web3'
import { RateXContract } from '../../contracts/rateX/RateX'
import { findRouteUniLikeAlgo } from '../routing/uni_like_algo/main'
import { findRouteWithIterativeSplitting, updateAlgoStartTime } from '../routing/iterative_spliting/main'

// First we call Solidity to get additional Pools data
async function getQuoteIterativeSplittingAlgo(tokenA: string, tokenB: string, amountIn: bigint, startTime: number): Promise<Quote> {
  const pools: Pool[] = await fetchPoolsData(tokenA, tokenB, 5, 5)
  updateAlgoStartTime(startTime)
  return findRouteWithIterativeSplitting(tokenA, tokenB, amountIn, pools, startTime)
}

async function getBestQuoteUniLikeAlgo(tokenA: string, tokenB: string, amountIn: bigint) {
  const pools: Pool[] = await fetchPoolsData(tokenA, tokenB, 5, 5)
  console.log('Fetched pools:', pools)
  console.log('Pool size: ', pools.length)
  return findRouteUniLikeAlgo(tokenA, tokenB, amountIn, pools)
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
    await RateXContract.methods .swapMultiHop(quote.routes[0], amountIn, minAmountOut, signer)
      .send({ from: signer })
      .on('transactionHash', function (hash: string) {
        transactionHash = hash
      })

    return { isSuccess: true, txHash: transactionHash } as ResponseType
  } catch (err: any) {
    return { isSuccess: false, errorMessage: err.message } as ResponseType
  }
}

/* Function to transform the quote to be compatible with the solidity contract
  * The solidity contract expects the poolId to be an address, but the graph returns it as a bytes32
  * The solidity contract also expects the token names to be removed
  * @param quote: The quote to be transformed
  * @returns The transformed quote
*/
function transformQuoteForSolidity(quote: Quote): Quote {
  quote.routes[0].swaps.map((swap) => {
    if (swap.poolId.length === 66) {
      swap.poolId = swap.poolId.slice(0, 42)      // convert to address
    }
    delete swap.tokenAName
    delete swap.tokenBName
    return swap
  })

  return quote
}

export { getQuoteIterativeSplittingAlgo, getBestQuoteUniLikeAlgo, executeSwapMultiHop }
