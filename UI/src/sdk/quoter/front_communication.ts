import initRPCProvider from "../../providers/RPCProvider"
import findBestOneHopRoute from "../routing/oneHopSwap"

// called by the UI
async function initGetQuote(token1: string, token2: string, tokenOneAmount: bigint, chainId: number): Promise<bigint> {
    
    // call functions that compare different routes
    findBestOneHopRoute(token1, token2, tokenOneAmount, chainId)

    // currently returning the expected output amount instead of a route
    // just to mock the data: 
    const web3 = initRPCProvider(chainId)
    return web3.utils.toBigInt(0)
}

export { initGetQuote}