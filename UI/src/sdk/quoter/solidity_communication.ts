import { Pool, Quote, ResponseType } from '../types'
import { fetchPoolsData } from './graph_communication'
import { ERC20_ABI } from '../../contracts/abi/common/ERC20_ABI'
import initRPCProvider from '../../providers/RPCProvider'
import Web3 from 'web3'
import {TQuoteUniLike} from "../routing/uni_like_algo/types";
import { RateXContract } from '../../contracts/rateX/RateX'
import {findRoute} from "../routing/main";

async function getQuote(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<Quote> {
  console.log('tokenIn: ', tokenIn)
  console.log('tokenOut: ', tokenOut)

  const pools: Pool[] = await fetchPoolsData(tokenIn, tokenOut, 5, 5)
  console.log('Fetched pools:', pools)
  console.log("Pool size: ", pools.length)

  return findRoute(tokenIn, tokenOut, amountIn, pools);
}

async function executeSwap(
    tokenIn: string,
    tokenOut: string,
    quote: Quote,
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
    quote = transformQuoteForSolidity(quote)

    console.log("usao u swap");

    // @ts-ignore
    await RateXContract.methods //@ts-ignore
        .swap(quote.routes, tokenIn, tokenOut, amountIn, minAmountOut, signer)
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
    return swap
  })

  return quote
}

export {getQuote, executeSwap}