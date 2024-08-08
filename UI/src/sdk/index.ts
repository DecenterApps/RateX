import Web3 from "web3"
import { findRoute } from "./routing/main"
import { fetchPoolsData } from "./swap/graph_communication"
import { Pool, Quote } from "./types"
import { RegisteredSubscription } from "web3/lib/commonjs/eth.exports"

interface RateXConfig {
    rpcUrl: string,
    chainId: number,
    dexes: Array<string>,
    graphApiKey: string
}

class RateX {
    rpcProvider: Web3<RegisteredSubscription>
    chainId: number
    graphApiKey: string


    constructor(config: RateXConfig) {
        this.rpcProvider = new Web3(new Web3.providers.HttpProvider(config.rpcUrl))
        this.chainId = config.chainId
        this.graphApiKey = config.graphApiKey

    };

    async getQuote(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<Quote> {
        const preFetchPools = Date.now();
        const pools: Pool[] = await fetchPoolsData(tokenIn, tokenOut, 5, 5, this.chainId, this.rpcProvider, this.graphApiKey)
        const middle = Date.now();
        const route = await findRoute(tokenIn, tokenOut, amountIn, pools, this.chainId)
        const finished = Date.now();
        console.log(middle - preFetchPools)
        return route
    }
}

export default RateX