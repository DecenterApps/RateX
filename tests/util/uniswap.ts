import Web3 from 'web3';
import QuoterABI from './QuoterABI.json'
import initRPCProvider from '../../UI/src/providers/RPCProvider';

const QUOTER_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

export const getUniswapOutputAmount = async (
    inputTokenAddress: string,
    outputTokenAddress: string,
    inputAmount: BigInt,
    chainId: 1 | 42161
): Promise<string> => {
    const web3 = initRPCProvider()
    const quoterContract = new web3.eth.Contract(QuoterABI, QUOTER_ADDRESS);
    const fees = [3000, 10000, 100, 500]
    let maxOut = BigInt(0);
    for (const fee of fees) {
        try {
            const quotedAmountOut = await quoterContract.methods.quoteExactInputSingle(
                inputTokenAddress,
                outputTokenAddress,
                fee, // Fee tier 0.3%
                inputAmount,
                0
            ).call();
            // @ts-ignore
            if (quotedAmountOut > maxOut)
                // @ts-ignore
                maxOut = quotedAmountOut
        } catch (error) {

        }
    }
    return maxOut.toString();
};
