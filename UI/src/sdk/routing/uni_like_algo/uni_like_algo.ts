import {Pool} from "../../types";
import computeRoutes from "./compute_routes_backtrack";
import {TRoute} from "./uni_types";

const AlgoParams = {
    maxHops: 3,
}

export async function findRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    pools: Pool[]
) {

    const routes: TRoute[] = computeRoutes(tokenIn, tokenOut, pools, AlgoParams.maxHops);
    console.log("Found routes: ", routes.length);
    routes.forEach(route => {
        console.log("Route: ", route);
        console.log("------------")
        route.pools.forEach(pool => {
            console.log("Pool: ", pool.poolId + ", DexId: " + pool.dexId);
        })
    });

}