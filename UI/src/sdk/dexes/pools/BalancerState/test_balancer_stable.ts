import { BalancerStablePool } from "./BalancerStablePool"
import { Token } from "../../../types"
import BigNumber from "bignumber.js"

const tokenIn = '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f'      // token: WBTC
const tokenOut = "0x542f16da0efb162d20bf4358efa095b70a100f9e"     // token: 2BTC
const amountIn = BigInt(100000000)                                // 1 WBTC

testOffchainAmountStable(tokenIn, tokenOut, amountIn)

export default function testOffchainAmountStable(tokenIn: string, tokenOut: string, amountIn: bigint) {

    const tokens: Token[] = [
      {
        _address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
        decimals: 8
      },
      {
        _address: '0x542f16da0efb162d20bf4358efa095b70a100f9e',
        decimals: 18
      }, {
        _address: '0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40',
        decimals: 18
      }
    ]
  
    // Vault: reserves  (getPoolTokens function)
    // Contract Pool-a: A (getAmplificationParameter -> vrati struct, treba nam value), swapFeePercentage (getSwapFeePercentage)
    
    const reserves = [new BigNumber(3530005308), new BigNumber(2596148429267412923497806828284479), new BigNumber(86544196105233714855)]
    const swapFeePercentage = new BigNumber(500000000000000)
    const A = '500000'                        
  
    const pool = new BalancerStablePool(
      "0x542f16da0efb162d20bf4358efa095b70a100f9e000000000000000000000436",
      'Curve',
      tokens,
      reserves,
      swapFeePercentage,
      A
    )
  
    const res = pool.calculateExpectedOutputAmount(tokenIn, tokenOut, amountIn)
    console.log("OFFCHAIN: ", res)
  }

/*

swap: ["0x542f16da0efb162d20bf4358efa095b70a100f9e000000000000000000000436", "0", "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f", "0x542f16da0efb162d20bf4358efa095b70a100f9e", "100000000", "0x"]
funds: ["0x", false, "0x", false]
limit: 1
deadline: 1792968092

{
  "poolId": "0x542f16da0efb162d20bf4358efa095b70a100f9e000000000000000000000436",
  "kind": 0,                
  "assetIn": "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
  "assetOut": "0x542f16da0efb162d20bf4358efa095b70a100f9e",
  "amount": "10000000",
  "userData": "0x"
}

{
  "sender": "0x00d4A50f3f6ff23072a7e60E3EA6c8F2036F978A",
  "fromInternalBalance": false,
  "recipient": "0x00d4A50f3f6ff23072a7e60E3EA6c8F2036F978A",
  "toInternalBalance": false
}

*/
//99796866023226590
//99796866023226590
// rezerce  3530005308,2596148429267412923497806828284479,86544196105233714855
