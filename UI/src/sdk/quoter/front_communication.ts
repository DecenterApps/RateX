import { DEXGraphFunctionality } from '../DEXGraphFunctionality';
import initRPCProvider from "../../providers/RPCProvider";

const initializedDexes: DEXGraphFunctionality[] = []
const topPoolsIds: string[] = []

async function initializeDexes(): Promise<void> {

    try {
        // IMPORTANT: for later -> go through folder and init every dex 
        // const files = await fs.promises.readdir('../sdk/dexes_graph')
        const files = ['SushiSwapV2.ts', 'UniswapV3.ts']
        for (const file of files) {
            if (file.endsWith('.ts')) {
                const module = await import(`../dexes_graph/${file}`);
                initializedDexes.push(module.initialise());
            }
        }
    } catch (err) {
        console.error('Error reading directory dexes_graph:', err);
    }
}

/* returns dictionary of dexes and their poolIds for token1 and token2:
*   UniswapV3: [poolId1, poolId2, ...],
*   SushiSwapV2: [poolId1, poolId2, ...]
*/
async function getPoolIdsForTokens(token1: string, token2: string): Promise<{ [dex: string]: string[] }> {

    const dexPoolIds: { [dex: string]: string[] } = {}
    
    for (const dex of initializedDexes) {
        const dict = await dex.matchBothTokens(token1, token2, 3);
        dexPoolIds[Object.keys(dict)[0]] = Object.values(dict)[0];
    }

    return dexPoolIds;
}

async function initGetQuote(token1: string, token2: string, tokenOneAmount: bigint, chainId: number): Promise<bigint> {

    initializeDexes()
    const dexPoolIds = await getPoolIdsForTokens(token1, token2)

    const web3 = initRPCProvider(chainId)
    return web3.utils.toBigInt(0)
}

function getTopPools(): void {

    // Get top pools from each dex in initializedDexes list
    initializedDexes.forEach(async (dex) => {
        const topPoolsIdsOneDex = await dex.topPools()
        topPoolsIds.push(...topPoolsIdsOneDex)
    })
}

export { getTopPools, initGetQuote }