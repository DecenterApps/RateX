import { Pool, Quote, ResponseType } from '../types'
import { fetchPoolsData } from './graph_communication'
import { ERC20_ABI } from '../../contracts/abi/common/ERC20_ABI'
import initRPCProvider from '../../providers/RPCProvider'
import Web3 from 'web3'
import { CreateRateXContract } from '../../contracts/rateX/RateX'
import { findRoute } from '../routing/main'

async function getQuote(tokenIn: string, tokenOut: string, amountIn: bigint, chainId: number): Promise<Quote> {
  console.log('tokenIn: ', tokenIn)
  console.log('tokenOut: ', tokenOut)

  const GRAPH_API_KEY = process.env.REACT_APP_GRAPH_API_KEY || ''
  const web3: Web3 = initRPCProvider(chainId)

  const pools: Pool[] = await fetchPoolsData(tokenIn, tokenOut, 5, 5, chainId, web3, GRAPH_API_KEY)
  console.log('Fetched pools:', pools)
  console.log('Pool size: ', pools.length)

  return await findRoute(tokenIn, tokenOut, amountIn, pools, chainId)
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
  const web3: Web3 = initRPCProvider(chainId)
  const tokenInContract = new web3.eth.Contract(ERC20_ABI, tokenIn)
  //@ts-ignore
  const balance: bigint = await tokenInContract.methods.balanceOf(signer).call()
  const ethBalance: bigint = BigInt(await web3.eth.getBalance(signer))

  const WETH_ADDRESS = chainId === 1 ? '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' : '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'

  if (balance < amountIn) {
    if (tokenInContract.options.address?.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
      // Wrap ETH
      const amountToWrap = amountIn - balance
      if (ethBalance < amountToWrap) {
        return { isSuccess: false, errorMessage: 'Insufficient balance' } as ResponseType
      }
      try {
        await tokenInContract.methods.deposit().send({ from: signer, value: amountToWrap.toString() })
      } catch (err: any) {
        return { isSuccess: false, errorMessage: 'Failed to wrap ETH' } as ResponseType
      }
    } else {
      return { isSuccess: false, errorMessage: 'Insufficient balance' } as ResponseType
    }
  }

  try {
    const RateXContract = CreateRateXContract(chainId)
    // @ts-ignore
    await tokenInContract.methods.approve(RateXContract.options.address, amountIn).send({ from: signer })
    let transactionHash: string = ''
    quote = transferQuoteWithBalancerPoolIdToAddress(quote)

    console.log('usao u swap')

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

/* Function to transform poolId from bytes32 to address
 * The solidity contract expects the poolId to be an address, but the graph for balancer returns it as a bytes32
 * @param quote: The quote to be transformed
 * @returns The transformed quote
 */
export function transferQuoteWithBalancerPoolIdToAddress(quote: Quote): Quote {
  quote.routes.forEach((route) =>
    route.swaps.map((swap) => {
      if (swap.poolId.length === 66) {
        swap.poolId = swap.poolId.slice(0, 42) // convert to address
      }
      return swap
    })
  )

  return quote
}

export { getQuote, executeSwap }
