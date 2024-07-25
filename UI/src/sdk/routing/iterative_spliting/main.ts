import BalancerV2 from "../../dexes/graph_queries/BalancerV2";
import CamelotV2 from "../../dexes/graph_queries/CamelotV2";
import Curve from "../../dexes/graph_queries/Curve";
import SushiSwapV2 from "../../dexes/graph_queries/SushiSwapV2";
import UniswapV2 from "../../dexes/graph_queries/UniswapV2";
import UniswapV3 from "../../dexes/graph_queries/UniswapV3";
import { DEXGraphFunctionality } from "../../DEXGraphFunctionality";
import { Quote, Route, Pool, PoolInfo } from "../../types";
import { createGraph, multiHopSwap } from "./multiHopSwap";
import objectHash from "object-hash";

export const getDex = (dexId: string) : DEXGraphFunctionality => {
    if (dexId === "UNI_V2")
        return UniswapV2.initialize();
    if(dexId==="SUSHI_V2")
        return SushiSwapV2.initialize();
    if(dexId==="UNI_V3")
        return UniswapV3.initialize();
    if(dexId==="CURVE")
        return Curve.initialize()
    if(dexId==="BALANCER_V2")
        return BalancerV2.initialize()
    if(dexId==="CAMELOT")
        return CamelotV2.initialize();
    
    return UniswapV2.initialize();
}

/*  Simple algorithm that splits the input amount into (100/step) parts of step% each and finds the best route for each split.
    The algorithm to find the best route for each iteration finds the route with the highest output amount.
    (code is seen in ./multiHopSwap.ts)
    After each iteration, the pools are updated with the amounts that passed through them.
*/
async function findRouteWithIterativeSplitting(tokenA: string, tokenB: string, amountIn: bigint, pools: Pool[]): Promise<Quote> {
    const graph = createGraph(pools)

    // percentage of the amountIn that we split into
    const step: number = 5
    let amountOut: bigint = BigInt(0)
    const poolMap: Map<string, Pool> = new Map<string, Pool>(pools.map((pool: Pool) => [pool.poolId, pool]))
    const routes: Map<string, Route> = new Map<string, Route>()
    const splitAmountIn: bigint = (amountIn * BigInt(step)) / BigInt(100)

    for (let i = 0; i < 100; i += step) {
        const route: Route = multiHopSwap(splitAmountIn, tokenA, tokenB, graph)
        const routeHash = objectHash(route.swaps)

        let existingRoute: Route | undefined = routes.get(routeHash)
        if (!existingRoute) {
            route.percentage = step
            routes.set(routeHash, route)
        } else {
            existingRoute.percentage += step
        }

        amountOut += route.quote
        updatePoolsInRoute(poolMap, route, splitAmountIn)
    }

    const foundRoutes: Route[] = [];

    for (let route of routes.values()) {
        route.amountIn = (BigInt(route.percentage) * amountIn) / BigInt(100);
        foundRoutes.push(route);
    }
    const missingAmount = amountIn - foundRoutes.reduce((acc, route) => acc + route.amountIn, BigInt(0));
    foundRoutes[0].amountIn += missingAmount;

    const quote: Quote = { routes: foundRoutes, quote: amountOut };

    let total = BigInt(0);
    for (const route of quote.routes) {
        let progress = route.amountIn;
        for (const swap of route.swaps) {
            const dex = getDex(swap.dexId);
            const [pool] = await dex.getAdditionalPoolDataFromSolidity([JSON.parse(localStorage.getItem(swap.poolId.toLowerCase()) || "{}") as PoolInfo])
            const amount = pool.calculateExpectedOutputAmount(swap.tokenIn, swap.tokenOut, progress)
            progress = amount;
        }
        route.quote = progress;
        total += progress;
    }
    quote.quote = total;
    console.log("IterativeQuote: ", quote);
    return quote;
}

// Function to update all the pools in a route with the amounts that passed through them
function updatePoolsInRoute(poolMap: Map<string, Pool>, route: Route, amountIn: bigint): void {
    for (let swap of route.swaps) {
        const pool: Pool | undefined = poolMap.get(swap.poolId)
        if (!pool) {
            console.log('Pool ', swap.poolId, " doesn't exist!")
            continue
        }

        const amountOut: bigint = pool.calculateExpectedOutputAmount(swap.tokenIn, swap.tokenOut, amountIn)
        pool.update(swap.tokenIn, swap.tokenOut, amountIn, amountOut)
        amountIn = amountOut
    }
}

export { findRouteWithIterativeSplitting }