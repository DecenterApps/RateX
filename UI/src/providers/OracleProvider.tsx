import Web3 from 'web3';
import Decimal from 'decimal.js';
import { OracleData } from '../constants/Interfaces';
import oracleToUSDList from '../constants/oracleToUSDList.json';

const web3 = new Web3(window.ethereum);

const oracleToUSDListData: OracleData = oracleToUSDList;

function contractFactory(tokenName: string, chainId: number) {
  const tokenData = oracleToUSDListData.oracles.find((token) => token.ticker === tokenName);
  if (!tokenData) {
    throw new Error(`Token "${tokenName}" not found in the JSON data.`);
  }

  const abi = tokenData.ABI;
  const contractAddress = tokenData.address[chainId];
  return new web3.eth.Contract(abi, contractAddress);
}

async function getTokenPrice(tokenName: string, chainId: number) {
  try {
    const oracleContract = contractFactory(tokenName, chainId)
    let value = await oracleContract.methods.latestAnswer().call()

    if(value !== null && typeof value === 'string') {
        // @ts-ignore
        let convertedValue = new Decimal(value.toString()).div(10 ** 8)
        return convertedValue.toNumber()
    } 
  } catch {
    console.error("Error fetching token price")
    return -1
  }
}

async function convertTokenAmountToUSD(amount: number, tokenName: string, chainId: number) {
  try {
    let USDValue = await getTokenPrice(tokenName, chainId)
    // @ts-ignore
    return USDValue !== null ? USDValue * amount : -1   
  } catch {
    console.error("Error fetching the amount in USD")
    return -1
  }
}

export default convertTokenAmountToUSD;
