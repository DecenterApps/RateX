import {Pool, Quote, Route} from "../../types";
import {createGraph, multiHopSwap} from "./multiHopSwap";
import objectHash from "object-hash";

let algoStartTime = 0

/*  Simple algorithm that splits the input amount into (100/step) parts of step% each and finds the best route for each split.
    The algorithm to find the best route for each iteration finds the route with the highest output amount.
    (code is seen in ./multiHopSwap.ts)
    After each iteration, the pools are updated with the amounts that passed through them.
*/
function findRouteWithIterativeSplitting(tokenA: string, tokenB: string, amountIn: bigint, pools: Pool[], startTime: number): Quote {
    const graph = createGraph(pools)

    // percentage of the amountIn that we split into
    const step: number = 5
    let amountOut: bigint = BigInt(0)
    const poolMap: Map<string, Pool> = new Map<string, Pool>(pools.map((pool: Pool) => [pool.poolId, pool]))
    const routes: Map<string, Route> = new Map<string, Route>()
    const splitAmountIn: bigint = (amountIn * BigInt(step)) / BigInt(100)

    for (let i = 0; i < 100; i += step) {
        console.log("iteration ", i, " for amount ", amountIn)
        // check if this calculation is for an outdated amount
        if(startTime !== algoStartTime) {
            console.log('Outdated amount, returning')
            return {routes: [], amountOut: BigInt(0)}
        }

        const route: Route = multiHopSwap(splitAmountIn, tokenA, tokenB, graph)
        const routeHash = objectHash(route.swaps)

        let existingRoute: Route | undefined = routes.get(routeHash)
        if (!existingRoute) {
            route.percentage = step
            routes.set(routeHash, route)
        } else {
            existingRoute.percentage += step
        }

        amountOut += route.amountOut
        updatePoolsInRoute(poolMap, route, splitAmountIn)
    }

    let quote: Quote = {routes: [], amountOut: amountOut}
    for (let route of routes.values()) {
        quote.routes.push(route)
    }

    console.log("Quote found: ")
    console.log(quote)
    return quote
}

// Function to update all the pools in a route with the amounts that passed through them
function updatePoolsInRoute(poolMap: Map<string, Pool>, route: Route, amountIn: bigint): void {
    for (let swap of route.swaps) {
        const pool: Pool | undefined = poolMap.get(swap.poolId)
        if (!pool) {
            console.log('Pool ', swap.poolId, " doesn't exist!")
            continue
        }

        const amountOut: bigint = pool.calculateExpectedOutputAmount(swap.tokenA, swap.tokenB, amountIn)
        pool.update(swap.tokenA, swap.tokenB, amountIn, amountOut)
        amountIn = amountOut
    }
}

function updateAlgoStartTime(newTimestamp: number): void {
    algoStartTime = newTimestamp
}

export { findRouteWithIterativeSplitting, updateAlgoStartTime }