import Decimal from 'decimal.js'
import { ethers } from 'ethers'

import { OracleData } from '../constants/Interfaces'
import oracleToUSDList from '../constants/oracleToUSDList.json'
import initRPCProvider from './RPCProvider'

const oracleToUSDListData: OracleData = oracleToUSDList
const ABI = [
  {
    inputs: [],
    name: 'latestAnswer',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

async function contractFactory(tokenTicker: string, chainId: number) {
  const oracleData = oracleToUSDListData.oracles.find((token) => token.ticker === tokenTicker)
  if (!oracleData) {
    throw new Error(`Token "${tokenTicker}" not found in the JSON data.`)
  }

  const contractAddress = oracleData.address[chainId]
  const { provider: ethersProvider, isFallback } = initRPCProvider()
  const signer = await ethersProvider.getSigner()

  return new ethers.Contract(contractAddress, ABI, signer)
}

async function getTokenPrice(tokenTicker: string, chainId: number): Promise<number> {
  try {
    const oracleContract = await contractFactory(tokenTicker, chainId)
    let value = await oracleContract.latestAnswer()

    let convertedValue = new Decimal(value.toString()).div(10 ** 8)
    return convertedValue.toNumber()
  } catch (error) {
    console.log('No price data available')
    return -1
  }
}

// not using this but we might need this in the future
async function convertTokenAmountToUSD(amount: number, tokenTicker: string, chainId: number) {
  try {
    let USDValue = await getTokenPrice(tokenTicker, chainId)
    // @ts-ignore
    return USDValue !== -1 ? USDValue * amount : -1
  } catch {
    console.error('Error fetching the amount in USD')
    return -1
  }
}

export { getTokenPrice }
