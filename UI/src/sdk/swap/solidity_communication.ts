import { Pool, Quote, ResponseType, SwapStep } from '../types'
import { fetchPoolsData } from './graph_communication'
import { ERC20_ABI } from '../../contracts/abi/common/ERC20_ABI'
import initRPCProvider from '../../providers/RPCProvider'
import Web3 from 'web3'
import { CreateRateXContract } from '../../contracts/rateX/RateX'
import { findRoute } from '../routing/main'
import { keccak256, toUtf8Bytes, ethers } from 'ethers'
import { useWriteContract } from 'wagmi'
import { RateXAbi } from '../../contracts/abi/RateXAbi'

import { RATE_X_ADDRESS as RATE_X_ADDRESS_MAINNET } from '../../contracts/addresses-mainnet'
import { RATE_X_ADDRESS as RATE_X_ADDRESS_ARBITRUM } from '../../contracts/addresses-arbitrum'

async function getQuote(tokenIn: string, tokenOut: string, amountIn: bigint, chainId: number): Promise<Quote> {
  console.log('tokenIn: ', tokenIn)
  console.log('tokenOut: ', tokenOut)

  const pools: Pool[] = await fetchPoolsData(tokenIn, tokenOut, 5, 5, chainId)
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
  chainId: number,
  writeContract: Function, // The wagmi writeContract hook
  hash: any,
  isConfirming: Boolean,
  isConfirmed: Boolean
): Promise<ResponseType> {
  const web3: Web3 = initRPCProvider(chainId);
  const tokenInContract = new web3.eth.Contract(ERC20_ABI, tokenIn);
  
  // Get the balance of the token in
  const balance: bigint = await tokenInContract.methods.balanceOf(signer).call();
  const ethBalance: bigint = BigInt(await web3.eth.getBalance(signer));

  const WETH_ADDRESS = chainId === 1 
    ? '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' 
    : '0x82af49447d8a07e3bd95bd0d56f35241523fbab1';

  if (balance < amountIn) {
    if (tokenInContract.options.address?.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
      // Wrap ETH
      const amountToWrap = amountIn - balance;
      if (ethBalance < amountToWrap) {
        return { isSuccess: false, errorMessage: 'Insufficient balance' } as ResponseType;
      }
      try {
        await tokenInContract.methods.deposit().send({ from: signer, value: amountToWrap.toString() });
      } catch (err: any) {
        return { isSuccess: false, errorMessage: 'Failed to wrap ETH' } as ResponseType;
      }
    } else {
      return { isSuccess: false, errorMessage: 'Insufficient balance' } as ResponseType;
    }
  }

  try {
    const RateXContract = CreateRateXContract(chainId);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30 minutes

    // Approve the token
    await writeContract({
      address: tokenInContract.options.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [RateXContract.options.address, amountIn],
    });
    while(isConfirming)
    {
      console.log("pending...")
    }
    console.log(isConfirming+ " "+ isConfirmed)
    console.log("done tx1")

    // Adjust the routes and swaps
    quote = transferQuoteWithBalancerPoolIdToAddress(quote);
    const routesAdjusted = quote.routes.map((route) => {
      const adjustedSwaps = route.swaps.map((swap) => {
        const encodedData = encodeSwapData(swap);
        const dexIdUint32 = hashStringToInt(swap.dexId);
        return { data: encodedData, dexId: dexIdUint32 };
      });
      return { ...route, swaps: adjustedSwaps };
    });

    let transactionHash: string = '';

    // Perform the swap
    await writeContract({
      address: RateXContract.options.address,
      abi: RateXAbi, // Assuming the ABI is part of the contract object
      functionName: 'swap',
      args: [routesAdjusted, tokenIn, tokenOut, amountIn, minAmountOut, signer, deadline],
      onTransactionHash: (hash: string) => {
        transactionHash = hash;
      },
    });

    return { isSuccess: true, txHash: transactionHash } as ResponseType;
  } catch (err: any) {
    return { isSuccess: false, errorMessage: err.message } as ResponseType;
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

// RateX contract expects dexId to be a uint32 that represents first 4 bytes of keccak256 hash of dexId, not a string
function hashStringToInt(dexName: string): number {
  const hash = keccak256(toUtf8Bytes(dexName))
  // Take the first 4 bytes (8 hex characters) and convert to uint32
  return parseInt(hash.slice(2, 10), 16)
}

// Encode swap data for RateX contract
function encodeSwapData(swap: SwapStep) {
  const abiCoder = new ethers.AbiCoder()

  if (swap.dexId === 'BALANCER' || swap.dexId === 'CURVE' || swap.dexId === 'UNI_V3') {
    // For DEXes like Balancer, Curve, UniswapV3 => we include poolId, tokenIn, and tokenOut
    return abiCoder.encode(['address', 'address', 'address'], [swap.poolId, swap.tokenIn, swap.tokenOut])
  }
  // For DEXes like Uniswap V2, Camelot, Sushiswap we include only tokenIn and tokenOut
  else return abiCoder.encode(['address', 'address'], [swap.tokenIn, swap.tokenOut])
}

export { getQuote, executeSwap }
