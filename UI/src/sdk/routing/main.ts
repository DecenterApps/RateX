import {Quote, Pool} from "../types";
import {findRouteUniLikeAlgo} from "./uni_like_algo/main";
import {findRouteWithIterativeSplitting} from "./iterative_spliting/main";

const UNI_LIKE_ALGO_ACTIVE = false;

export function findRoute(tokenIn: string, tokenOut: string, amountIn: bigint, pools: Pool[]): Quote {

    if (UNI_LIKE_ALGO_ACTIVE) {
        return findRouteUniLikeAlgo(tokenIn, tokenOut, amountIn, pools);
    } else {
        return findRouteWithIterativeSplitting(tokenIn, tokenOut, amountIn, pools);
    }
}