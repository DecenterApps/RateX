import { ethers } from 'ethers';
import QuoterABI from './QuoterABI.json';

function initMainnetProvider(): ethers.JsonRpcProvider {
    const MAINNET_URL = process.env.REACT_APP_MAINNET_URL;
    return new ethers.JsonRpcProvider(MAINNET_URL);
}

function initArbitrumProvider(): ethers.JsonRpcProvider {
    const ARBITRUM_URL = process.env.REACT_APP_ARBITRUM_URL;
    return new ethers.JsonRpcProvider(ARBITRUM_URL);
}

function initRPCProvider(chainId: 42161 | 1): ethers.JsonRpcProvider {
    if (chainId === 42161) {
        return initArbitrumProvider();
    } else if (chainId === 1) {
        return initMainnetProvider();
    }
    throw new Error("Invalid chain id");
}

const QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

export const getUniswapOutputAmount = async (
    inputTokenAddress: string,
    outputTokenAddress: string,
    inputAmount: BigInt,
    chainId: 1 | 42161
): Promise<string> => {
    const provider = initRPCProvider(chainId);
    const quoterContract = new ethers.Contract(QUOTER_ADDRESS, QuoterABI, provider);
    const fees = [3000, 10000, 100, 500];
    let maxOut = BigInt(0);
    for (const fee of fees) {
        try {
            const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall(
                inputTokenAddress,
                outputTokenAddress,
                fee,
                inputAmount,
                0
            );
            if (BigInt(quotedAmountOut) > maxOut) {
                maxOut = BigInt(quotedAmountOut);
            }
        } catch (error) {
            //console.error(`Error quoting fee tier ${fee}:`, error);
        }
    }
    return maxOut.toString();
};
