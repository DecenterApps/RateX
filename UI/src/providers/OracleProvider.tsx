import Decimal from 'decimal.js';
import { OracleData } from '../constants/Interfaces';
import oracleToUSDList from '../constants/oracleToUSDList.json';
import initRPCProvider from './RPCProvider';

const oracleToUSDListData: OracleData = oracleToUSDList;
const ABI = [{"inputs":[],"name":"latestAnswer","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"}]

function contractFactory(tokenTicker: string, chainId: number) {
  const oracleData = oracleToUSDListData.oracles.find((token) => token.ticker === tokenTicker);
  if (!oracleData) {
    throw new Error(`Token "${tokenTicker}" not found in the JSON data.`);
  }

  const contractAddress = oracleData.address[chainId];
  const web3 = initRPCProvider(chainId);
  // @ts-ignore
  return new web3.eth.Contract(ABI, contractAddress);
}

async function getTokenPrice(tokenTicker: string, chainId: number): Promise<number> {
  try {
    const oracleContract = contractFactory(tokenTicker, chainId)
    console.log(oracleContract)
    let value = await oracleContract.methods.latestAnswer().call()
    // @ts-ignore
    let convertedValue = new Decimal(value.toString()).div(10 ** 8)
    return convertedValue.toNumber()

  } catch (error) {
    console.error("Error fetching token price")
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
    console.error("Error fetching the amount in USD")
    return -1
  }
}

export { getTokenPrice };
