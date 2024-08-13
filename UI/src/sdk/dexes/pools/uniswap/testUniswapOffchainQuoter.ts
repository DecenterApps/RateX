/**
 * If you want to run this file separately, or any other in ts isolated environment
 * ts-node --esm dexes/pools/uniswap/testUniswapOffchainQuoter.ts
 *
 * remove "type": "module" from sdk package.json
 * And remove rpc function in RPC provider because window object is available only in browser
 *
 * Later if you want to run things in browser, add "type": "module" back to sdk package.json
 *
 * This examples assumes that you have localhost hardhat node running with deployed contracts
 * */

import { TradeInfo } from './types'
import { Token } from '../../../types'
import { addresses } from '../../../utils/addresses'
import { UniswapState } from './uniswapState'
import { UniswapV3Pool } from './UniswapV3'
import Web3 from 'web3'
import { IQuoterV2_ABI } from '../../../../contracts/abi/common/IQuoterV2_ABI'
import { initLocalHardhatProvider } from '../../../../providers/RPCProvider'

const web3: Web3 = initLocalHardhatProvider()

const POOLS = [
  addresses.univ3_wbtc_eth_pool_0_3,
  addresses.gmx_usdc_pool_0_1,
  addresses.uni_weth_pool,
  addresses.weth_link_pool,
  addresses.dai_usdce_pool_0_0_1,
]
const quoterContract = new web3.eth.Contract(IQuoterV2_ABI, addresses.uniQuoterV2)

async function testQuote() {
  const startTimestamp = Date.now()
  await UniswapState.initializeFreshPoolsData(POOLS, 1, web3)
  const endTimestamp = Date.now()

  console.log('Time taken for initialization: ', endTimestamp - startTimestamp)

  const trades: TradeInfo[] = getTestTrades()

  for (let tradeInfo of trades) {
    let params = {
      tokenIn: tradeInfo.tokenIn,
      tokenOut: tradeInfo.tokenOut,
      amountIn: tradeInfo.amountIn,
      fee: tradeInfo.fee,
      sqrtPriceLimitX96: 0,
    }
    const tokenIn = { _address: tradeInfo.tokenIn } as Token
    const tokenOut = { _address: tradeInfo.tokenOut } as Token
    //@ts-ignore
    let x: any[] = await quoterContract.methods.quoteExactInputSingle(params).call()

    const uniV3Pool = new UniswapV3Pool(tradeInfo.pool, 'uniswap', [tokenIn, tokenOut])

    let y = uniV3Pool.calculateExpectedOutputAmount(tradeInfo.tokenIn, tradeInfo.tokenOut, tradeInfo.amountIn)

    console.log('-------')
    console.log('Uniswap quote: ', x[0], x[2])
    console.log('Offchain quote: ', y)
  }
}

function getTestTrades(): TradeInfo[] {
  let trades: TradeInfo[] = []

  trades.push(
    new TradeInfo(
      addresses.univ3_wbtc_eth_pool_0_3,
      addresses.wethToken,
      addresses.wbtcToken,
      BigInt('100000000000000000000'), // 100 WETH
      BigInt(3000)
    )
  )
  trades.push(
    new TradeInfo(
      addresses.gmx_usdc_pool_0_1,
      addresses.gmxToken,
      addresses.usdcToken,
      BigInt('200000000000000000000'), // 200 GMX
      BigInt(10000)
    )
  )
  trades.push(
    new TradeInfo(
      addresses.uni_weth_pool,
      addresses.wethToken,
      addresses.uniToken,
      BigInt('1000000000000000000'), // 1 WETH
      BigInt(3000)
    )
  )
  trades.push(
    new TradeInfo(
      addresses.weth_link_pool,
      addresses.linkToken,
      addresses.wethToken,
      BigInt('3000000000000000000000'), // 3000 LINK
      BigInt(3000)
    )
  )
  trades.push(
    new TradeInfo(
      addresses.dai_usdce_pool_0_0_1,
      addresses.usdceToken,
      addresses.daiToken,
      BigInt('10000000000'), // 10 000 usdc
      BigInt(100)
    )
  )

  // ZERO FOR ONE

  trades.push(
    new TradeInfo(
      addresses.univ3_wbtc_eth_pool_0_3,
      addresses.wbtcToken,
      addresses.wethToken,
      BigInt('1000000000'), // 10 WBTC
      BigInt(3000)
    )
  )
  trades.push(
    new TradeInfo(
      addresses.gmx_usdc_pool_0_1,
      addresses.usdcToken,
      addresses.gmxToken,
      BigInt('1000000000'), // 1000 USDC
      BigInt(10000)
    )
  )
  trades.push(
    new TradeInfo(
      addresses.uni_weth_pool,
      addresses.uniToken,
      addresses.wethToken,
      BigInt('1000000000000000000000'), // 1000 UNI
      BigInt(3000)
    )
  )
  trades.push(
    new TradeInfo(
      addresses.weth_link_pool,
      addresses.wethToken,
      addresses.linkToken,
      BigInt('10000000000000000000'), // 10 WETH
      BigInt(3000)
    )
  )
  trades.push(
    new TradeInfo(
      addresses.dai_usdce_pool_0_0_1,
      addresses.daiToken,
      addresses.usdceToken,
      BigInt('1000000000000000000000'), // 1000 DAI
      BigInt(100)
    )
  )

  return trades
}

async function main() {
  await testQuote()
}

main()
