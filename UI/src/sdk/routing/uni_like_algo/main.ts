import {Pool, Quote, Route, SwapStep} from "../../types";
import {TQuoteUniLike, TRoute,} from "./types";
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
): Quote {

    const routes: TRoute[] = computeRoutes(tokenIn, tokenOut, pools, algoParams.maxHops);
    const amounts = calculateAmountDistribution(amountIn, algoParams.distributionPercentage);
    console.log("Amounts:", amounts);
    console.log("Amounts size:", amounts.length);
    console.log("Routes size:", routes.length);

    const routesWithQuotes = getRoutesWithQuotes(routes, amounts);

    const swapFinder = new SwapFinder(
        algoParams,
        routesWithQuotes,
        amounts.map(amount => amount.percentage),
        amountIn
    );
    const quote = swapFinder.findBestRoute();
    console.log("UniLikeQuote:", quote);

    return convertResponseToFoundQuoteType(quote);
}

function convertResponseToFoundQuoteType(q: TQuoteUniLike): Quote {
    const routes = q.routes.map(r => {
        const route = r.route;
        let tokenIn = route.tokenIn;
        let swaps: SwapStep[] = [];

        route.steps.forEach(step => {
            swaps.push({
                poolId: step.pool.poolId,
                dexId: step.pool.dexId,
                tokenIn: tokenIn,
                tokenOut: step.tokenOut
            });

            tokenIn = step.tokenOut;
        });

        return {
            swaps: swaps,
            amountIn: r.amount.amountIn,
            percentage: r.amount.percentage,
            quote: r.quote
        } as Route;
    });

    return {
        routes: routes,
        quote: q.quote
    };
}
