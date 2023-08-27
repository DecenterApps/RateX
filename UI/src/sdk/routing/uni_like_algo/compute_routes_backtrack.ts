import {Pool} from "../../types";
import {ComputeRoutesParams, TRoute} from "./uni_types";


export default function computeRoutes(
    tokenIn: string,
    tokenOut: string,
    pools: Pool[],
    maxHops: number
) {
    const usedPools = Array<boolean>(pools.length).fill(false);
    const routes: TRoute[] = [];

    const params = new ComputeRoutesParams(tokenIn, tokenOut, pools, maxHops);

    _computeRoutes(
        params,
        [],
        usedPools,
        routes,
        tokenIn
    );

    return routes;
}

function _computeRoutes(
    params: ComputeRoutesParams,
    currentRoute: Pool[],
    usedPools: boolean[],
    foundRoutes: TRoute[],
    previousTokenOut: string
) {
    if (currentRoute.length > params.maxHops) {
        return;
    }

    if (routeFound(currentRoute, params)) {
        foundRoutes.push({
            pools: [...currentRoute],
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut
        });
        return;
    }

    for (let i = 0; i < params.pools.length; i++) {

        if (usedPools[i]) {
            continue;
        }

        const curPool = params.pools[i];

        if (!curPool.containsToken(previousTokenOut)) {
            continue;
        }

        const currentTokenOut = curPool.getToken0()._address === previousTokenOut
            ? curPool.getToken1()._address
            : curPool.getToken0()._address;

        currentRoute.push(curPool);
        usedPools[i] = true;

        _computeRoutes(
            params,
            currentRoute,
            usedPools,
            foundRoutes,
            currentTokenOut
        );

        usedPools[i] = false;
        currentRoute.pop();
    }
}

function routeFound(route: Pool[], params: ComputeRoutesParams): boolean {
    return route.length > 0 && route[route.length - 1].containsToken(params.tokenOut);
}

