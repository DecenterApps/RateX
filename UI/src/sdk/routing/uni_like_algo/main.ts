import {Pool} from "../../types";
import {
    TQuoteUniLike,
    TRoute,
} from "./types";
import computeRoutes from "./compute_routes_backtrack";
import calculateAmountDistribution from "./amount_distribution";
import {getRoutesWithQuotes} from "./routes_quoter";
import {SwapFinder} from "./swap_finder";
import {algoParams} from "./algo_config";

export function findRouteUniLikeAlgo(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    pools: Pool[]
): TQuoteUniLike {

    const routes: TRoute[] = computeRoutes(tokenIn, tokenOut, pools, algoParams.maxHops);
    const amounts = calculateAmountDistribution(amountIn, algoParams.distributionPercentage);
    const routesWithQuotes = getRoutesWithQuotes(routes, amounts);

    const swapFinder = new SwapFinder(
        algoParams,
        routesWithQuotes,
        amounts.map(amount => amount.percentage),
        amountIn
    );
    const quote = swapFinder.findBestRoute();
    console.log("Quote:", quote);
    return quote;
}