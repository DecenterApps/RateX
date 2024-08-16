import { Quote, ResponseType, Route, SwapStep } from '../types'
import { ERC20_ABI } from '../contracts/abi/common/ERC20_ABI'
import initRPCProvider from '../providers/RPCProvider'
import Web3 from 'web3'
import { CreateRateXContract } from '../contracts/rateX/RateX'
import { keccak256, toUtf8Bytes, ethers } from 'ethers'

async function executeSwap(
  tokenIn: string,
  tokenOut: string,
  quote: Quote,
  amountIn: bigint,
  minAmountOut: bigint,
  signer: string,
  chainId: number
): Promise<ResponseType> {
  const web3: Web3 = initRPCProvider()
  const tokenInContract = new web3.eth.Contract(ERC20_ABI, tokenIn)
  //@ts-ignore
  const balance: bigint = await tokenInContract.methods.balanceOf(signer).call()
  const ethBalance: bigint = BigInt(await web3.eth.getBalance(signer))

  const WETH_ADDRESS = chainId === 1 ? '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' : '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
  const TETHER_ADDRESS = chainId === 1 ? '0xdac17f958d2ee523a2206206994597c13d831ec7' : '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9'

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
    // Check for allowance if tokenIn is Tether
    if (checkIfRouteContainsToken(quote.routes, TETHER_ADDRESS)) {
      const tetherContract = new web3.eth.Contract(ERC20_ABI, TETHER_ADDRESS)
      // @ts-ignore
      const tetherAllowance: bigint = await tetherContract.methods.allowance(signer, RateXContract.options.address).call()
      if (tetherAllowance !== BigInt(0)) {
        // @ts-ignore
        await tetherContract.methods.approve(RateXContract.options.address, 0).send({ from: signer })
      }
    }

    // @ts-ignore
    await tokenInContract.methods.approve(RateXContract.options.address, amountIn).send({ from: signer })
    let transactionHash: string = ''
    quote = transferQuoteWithBalancerPoolIdToAddress(quote)

    const routesAdjusted = quote.routes.map((route) => {
      const adjustedSwaps = route.swaps.map((swap) => {
        // Encode the swap data based on the dexId
        const encodedData = encodeSwapData(swap)
        // Convert dexId to uint32
        const dexIdUint32 = hashStringToInt(swap.dexId)

        return { data: encodedData, dexId: dexIdUint32 }
      })
      return { ...route, swaps: adjustedSwaps }
    })

    const deadline = Math.floor(Date.now() / 1000) + 60 * 30 // 30 minutes

    console.log('usao u swap')
    // @ts-ignore
    await RateXContract.methods //@ts-ignore
      .swap(routesAdjusted, tokenIn, tokenOut, amountIn, minAmountOut, signer, deadline)
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

// RateX contract expects dexId to be a uint32 that represents first 4 bytes of keccak256 hash of dexId, not a string
function hashStringToInt(dexName: string): number {
  const hash = keccak256(toUtf8Bytes(dexName))
  // Take the first 4 bytes (8 hex characters) and convert to uint32
  return parseInt(hash.slice(2, 10), 16)
}

// Encode swap data for RateX contract
function encodeSwapData(swap: SwapStep) {
  const abiCoder = new ethers.AbiCoder()

  if (swap.dexId === 'BALANCER_V2' || swap.dexId === 'CURVE' || swap.dexId === 'UNI_V3') {
    // For DEXes like Balancer, Curve, UniswapV3 => we include poolId, tokenIn, and tokenOut
    return abiCoder.encode(['address', 'address', 'address'], [swap.poolId, swap.tokenIn, swap.tokenOut])
  }
  // For DEXes like Uniswap V2, Camelot, Sushiswap we include only tokenIn and tokenOut
  else return abiCoder.encode(['address', 'address'], [swap.tokenIn, swap.tokenOut])
}

function checkIfRouteContainsToken(routes: Route[], tokenAddress: string): boolean {
  for (const route of routes) {
    for (const swap of route.swaps) {
      if (swap.tokenIn === tokenAddress) {
        return true
      }
    }
  }
  return false
}

export { executeSwap }
