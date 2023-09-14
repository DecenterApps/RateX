import {Pool} from "../../types";
import {ComputeRoutesParams, TRoute, TRouteStep} from "./types";

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
    currentRoute: TRouteStep[],
    usedPools: boolean[],
    foundRoutes: TRoute[],
    previousTokenOut: string
) {
    if (currentRoute.length > params.maxHops) {
        return;
    }

    if (routeFound(currentRoute, params)) {
        foundRoutes.push({
            steps: [...currentRoute],
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

        const tokensToExplore = curPool.tokens.filter((token) => token._address.toLowerCase() !== previousTokenOut.toLowerCase());

        for (let token of tokensToExplore) {
            currentRoute.push({pool: curPool, tokenOut: token._address});
            usedPools[i] = true;

            _computeRoutes(
                params,
                currentRoute,
                usedPools,
                foundRoutes,
                token._address
            );

            usedPools[i] = false;
            currentRoute.pop();
        }
    }
}

function routeFound(route: TRouteStep[], params: ComputeRoutesParams): boolean {
    return route.length > 0 && route[route.length - 1].tokenOut.toLowerCase() === params.tokenOut.toLowerCase();
}

