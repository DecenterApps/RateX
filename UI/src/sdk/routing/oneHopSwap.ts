import { getPoolIdsForToken } from "../quoter/graph_communication"
import { PoolInfo } from "../DEXGraphFunctionality"
import { getAdditionalPoolInfo, AdditionalPoolInfo } from "../quoter/solidity_communication"

// THIS CODE IS FOR PROOF OF CONCEPT 
// future: instead of checking out output amount for each route in every iteration
//         we will have a dp algorithm to find the best route 

const SWAP_PERCENT = 5

interface Route {
    pools: string[]                                //addresses of the pools
}

/* Function to fetch and preprocess pools
    * GRAPH API: get poolIDs for tokenIn and tokenOut (top 5 pools by volume from each dex)
    * SOLIDITY: get additional info for each pool (needs to be 1 call)
    * divide pools back into poolsIn and poolsOut
*/
async function preprocessPools(tokenIn: string, tokenOut: string, amountIn: bigint, chainId: number): Promise<[AdditionalPoolInfo[], AdditionalPoolInfo[], Map<string, AdditionalPoolInfo>]> {

    // Graph
    let topPoolsIn: PoolInfo[] = await getPoolIdsForToken(tokenIn, 5)
    let topPoolsOut: PoolInfo[] = await getPoolIdsForToken(tokenOut, 5)

    // Solidity - get additional info for each pool (needs to be 1 call)
    const combinedTopPoolsIds = [...topPoolsIn, ...topPoolsOut]
    const poolsAdditionalInfo = await getAdditionalPoolInfo(combinedTopPoolsIds)

    // Map from poolId to AdditionalPoolInfo
    const poolsAdditionalInfoMap = new Map<string, AdditionalPoolInfo>();
    for (const info of poolsAdditionalInfo) {
        poolsAdditionalInfoMap.set(info.poolId, info)
    }

    // Divide pools back into poolsIn and poolsOut
    const poolsInAdditionalInfo: AdditionalPoolInfo[] = topPoolsIn.map(pool => poolsAdditionalInfoMap.get(pool.poolId)).filter(info => info !== undefined) as AdditionalPoolInfo[]
    const poolsOutAdditionalInfo: AdditionalPoolInfo[] = topPoolsOut.map(pool => poolsAdditionalInfoMap.get(pool.poolId)).filter(info => info !== undefined) as AdditionalPoolInfo[]

    return [poolsInAdditionalInfo, poolsOutAdditionalInfo, poolsAdditionalInfoMap]
}

// Function to find all viable routes between two tokens
function findViableRoutes(poolsIn: AdditionalPoolInfo[], poolsOut: AdditionalPoolInfo[]): Route[] {

    return poolsIn.flatMap(poolIn => poolsOut
        .filter(poolOut => poolIn.tokenA === poolOut.tokenB)
        .map(poolOut => ({ pools: [poolIn.poolId, poolOut.poolId] }))
    )
}

/* Function to calculate the expected output amount of a swap through a pool (amounts are expressed in wei)
    * @param fee: the fee of the pool (for Uniswap V2 it is fixed to 0.003)
    * @returns: the expected output amount of the swap (expressed in wei)
*/
function calculateExpectedOutputAmountPool(amount1: bigint, reserve1: bigint, reserve2: bigint, fee: number = 0.003): bigint {
    const k = reserve1 * reserve2
    const amount2 = reserve2 - k / (reserve1 + amount1)
    const price = amount2 * BigInt((1 - fee))
    return price
}

// Function to calculate the expected output amount of a swap through a route (amounts are expressed in wei)
function calculateExpectedOutputAmountRoute(poolInfoMap: Map<string, AdditionalPoolInfo>, route: Route, amountIn: bigint): bigint {
    let amountOut = amountIn
    for (let i = 0; i < route.pools.length; i++) {
        const pool: AdditionalPoolInfo | undefined = poolInfoMap.get(route.pools[i]);
        if (pool)
            amountOut = calculateExpectedOutputAmountPool(amountOut, pool.reserveA, pool.reserveB);
    }
    return amountOut
}

// Function to find the optimal route for a swap between two tokens
function findOptimalPathForSwapAmount(poolInfoMap: Map<string, AdditionalPoolInfo>, routes: Route[], amount: bigint): Route {

    let optimalRoute: Route = routes[0]
    let optimalAmount: bigint = BigInt(0)

    for (let i = 0; i < routes.length; i++) {
        const amountOut = calculateExpectedOutputAmountRoute(poolInfoMap, routes[i], amount)
        if (amountOut > optimalAmount) {
            optimalAmount = amountOut
            optimalRoute = routes[i]
        }
    }

    return optimalRoute
}

// Function to update the poolInfoMap with the new reserves after each iteration of deciding the optimal path
function updatePools(poolInfoMap: Map<string, AdditionalPoolInfo>, route: Route, amount: bigint): Map<string, AdditionalPoolInfo> {

    let currAmount = amount;
    for (let i = 0; i < route.pools.length; i++) {
        const poolId = route.pools[i];
        const pool: AdditionalPoolInfo | undefined = poolInfoMap.get(poolId);
        if (pool) {
            const newReserveA = pool.reserveA + currAmount
            currAmount = calculateExpectedOutputAmountPool(currAmount, pool.reserveA, pool.reserveB);
            const newReserveB = pool.reserveB - currAmount
            
            poolInfoMap.set(poolId, {
                ...pool,
                reserveA: newReserveA,
                reserveB: newReserveB
            })
        }
    }
    return poolInfoMap;
}

/* Function to aggregate found routes for Solidity
    * @param routes: the routes to be aggregated
    * @returns: map from Route to the percentage of the Input Amount for that Route
*/
function aggregateFoundRoutesForSolidity(routes: Route[]): Map<Route, number> {

    const routeToPercentageMap = new Map<Route, number>();

    for (let i = 0; i < routes.length; i++) {
        if (routeToPercentageMap.has(routes[i])) 
            routeToPercentageMap.set(routes[i], routeToPercentageMap.get(routes[i])! + SWAP_PERCENT)
        else 
            routeToPercentageMap.set(routes[i], SWAP_PERCENT)
    }

    return routeToPercentageMap;
}


/* Function to find the best one hop route between two tokens
    * @param tokenOneAmount: the amount of token1 to be swapped (expressed in wei)
    * @param chainId: the chainId of the current L2 chain
    * @returns: routeToPercentageMap = map from Route to the percentage of the Input Amount for that Route
*/
async function findBestOneHopRoute(tokenIn: string, tokenOut: string, amountIn: bigint, chainId: number): Promise<Map<Route, number>> {

    // Fetch all pools data
    let [inputTokenPools, outputTokenPools, poolInfoMap] = await preprocessPools(tokenIn, tokenOut, amountIn, chainId)

    // Find viable routes
    const viableRoutes: Route[] = findViableRoutes(inputTokenPools, outputTokenPools)

    // Find optimal route
    let optimalRoutes: Route[] = []

    const iterationNumber = BigInt(100) / BigInt(SWAP_PERCENT);
    for (let i = BigInt(1); i <= iterationNumber; i++) {
        const fraction = (amountIn * i) / iterationNumber;
        const route = findOptimalPathForSwapAmount(poolInfoMap, viableRoutes, fraction);
        poolInfoMap = updatePools(poolInfoMap, route, fraction);
    }

    // Aggregate the routes into something comprehensive for Solidity to execute a swap
    return aggregateFoundRoutesForSolidity(optimalRoutes)
}   

export default findBestOneHopRoute