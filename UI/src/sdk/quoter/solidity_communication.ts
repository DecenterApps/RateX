import { PoolEntry, PoolInfo, QuoteResultEntry, ResponseType } from '../types'
import { fetchPoolsData } from './graph_communication'
import { ERC20_ABI } from '../../contracts/ERC20_ABI'
import initRPCProvider from '../../providers/RPCProvider'
import Web3 from 'web3'
import { RateXContract } from '../../contracts/RateX'
import { createGraph, multiHopSwap } from '../routing/multiHopSwap'

// In future will have chainId
export type AdditionalPoolInfo = {
  poolId: string
  dexId: string
  tokenA: string // address
  tokenB: string // address
  reserveA: bigint // in wei
  reserveB: bigint // in wei
  fee: number
}

async function getAdditionalPoolInfo(poolsInfo: PoolInfo[]): Promise<AdditionalPoolInfo[]> {
  const additionalPoolsInfo: AdditionalPoolInfo[] = []

  // TO-DO: calls to Solidity

  return additionalPoolsInfo
}

async function getBestQuote(token1: string, token2: string, tokenOneAmount: bigint): Promise<QuoteResultEntry> {
  const pools: PoolInfo[] = await fetchPoolsData(token1, token2, 5)
  const poolEntries: PoolEntry[] = pools.map((p: PoolInfo) => new PoolEntry(p.poolId, p.dexId))

  //@ts-ignore
  const result: QuoteResultEntry[] = await RateXContract.methods //@ts-ignore
    .quoteV2(poolEntries, token1, token2, tokenOneAmount)
    .call()
    .catch((err: any) => {
      console.log('error: ', err)
    })

  // just do a simple max for now, no need to check for liquidity of the pool
  return result.reduce((prev, current) => {
    return prev.amountOut > current.amountOut ? prev : current
  })
}

async function getBestQuoteMultiHop(tokenA: string, tokenB: string, amountIn: bigint) {
  const poolsInfo: PoolInfo[] = await fetchPoolsData(tokenA, tokenB, 5)
  // send to solidity to get other info for each pool
  // parse return values into Pool[] with every DEX having its own class that extends Pool

  // const pools: Pool[] = []
  //
  // pools.push(new SushiSwapV2Pool('1', 'SUSHI_V2', 'a', 'b', BigInt(1), BigInt(1000)))
  // pools.push(new SushiSwapV2Pool('2', 'SUSHI_V2', 'a', 'b', BigInt(1), BigInt(2000)))
  // pools.push(new SushiSwapV2Pool('3', 'SUSHI_V2', 'b', 'c', BigInt(1000), BigInt(1000)))
  // pools.push(new SushiSwapV2Pool('4', 'SUSHI_V2', 'a', 'c', BigInt(1), BigInt(500)))

  const graph = createGraph(pools)

  return multiHopSwap(amountIn, tokenA, tokenB, graph)
}

async function executeSwap(
  token1: string,
  token2: string,
  quote: QuoteResultEntry,
  amountIn: bigint,
  minAmountOut: bigint,
  signer: string,
  chainId: number
): Promise<ResponseType> {
  const web3: Web3 = initRPCProvider(42161)
  const tokenInContract = new web3.eth.Contract(ERC20_ABI, token1)

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
      .swap(quote.poolAddress, token1, token2, amountIn, minAmountOut, signer, quote.dexId)
      .send({ from: signer })
      .on('transactionHash', function (hash: string) {
        transactionHash = hash
      })

    return { isSuccess: true, txHash: transactionHash } as ResponseType
  } catch (err: any) {
    return { isSuccess: false, errorMessage: err.message } as ResponseType
  }
}

export { getAdditionalPoolInfo, getBestQuote, executeSwap, getBestQuoteMultiHop }
