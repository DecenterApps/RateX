import {Quote, Route, SwapStep, Pool} from "../../types";
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
): Quote {

    const routes: TRoute[] = computeRoutes(tokenIn, tokenOut, pools, algoParams.maxHops);
    const amounts = calculateAmountDistribution(amountIn, algoParams.distributionPercentage);
    console.log("Amounts:", amounts);
    const routesWithQuotes = getRoutesWithQuotes(routes, amounts);

    const swapFinder = new SwapFinder(
        algoParams,
        routesWithQuotes,
        amounts.map(amount => amount.percentage),
        amountIn
    );
    const quote = swapFinder.findBestRoute();
    console.log("UniLikeQuote:", quote);

    const convertedQuote = convertResponseToFoundQuoteType(quote);
    return convertedQuote;
}

function convertResponseToFoundQuoteType(q: TQuoteUniLike): Quote {
    const routes = q.routes.map(r => {
        const route = r.route;
        let tokenIn = route.tokenIn;
        let swaps: SwapStep[] = [];

        route.pools.forEach(pool => {

            const tokenOut = pool.tokens[0]._address == tokenIn
                ? pool.tokens[1]._address
                : pool.tokens[0]._address;

            swaps.push({
                poolId: pool.poolId,
                dexId: pool.dexId,
                tokenIn: tokenIn,
                tokenOut: tokenOut
            });

            tokenIn = tokenOut;
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