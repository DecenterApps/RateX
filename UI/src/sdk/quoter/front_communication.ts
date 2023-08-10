import {QuoteResultEntry, ResponseType} from "../types";
import {executeSwap, getBestQuote} from "./solidity_communication";

async function initGetQuote(token1: string, token2: string, tokenOneAmount: bigint): Promise<QuoteResultEntry> {
    return getBestQuote(token1, token2, tokenOneAmount)
}

async function swap(
    token1: string,
    token2: string,
    quote: QuoteResultEntry,
    amountIn: bigint,
    slippagePercentage: number,
    signer: string,
    chainId: number): Promise<ResponseType>
{
    const amountOut = quote.amountOut
    const slippageBigInt = BigInt(slippagePercentage * 100)
    const minAmountOut = (amountOut * (BigInt(100) - slippageBigInt)) / BigInt(100)

    return executeSwap(token1, token2, quote, amountIn, minAmountOut, signer, chainId)
}

export {initGetQuote, swap}