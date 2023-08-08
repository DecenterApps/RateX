import { fetchPoolsData, getPoolIdsForTokenPairs } from "../quoter/front_communication";
import { USDT_ADDRESS, WETH_ADDRESS } from "./tokens";


export async function checkFetchPoolsData() {
    const res = await fetchPoolsData(USDT_ADDRESS, WETH_ADDRESS, 500);
    console.log("result: ", res);
}

export async function checkGetPoolIdsForTokenPairs() {
    const res = await getPoolIdsForTokenPairs(USDT_ADDRESS, WETH_ADDRESS);
    console.log("result: ", res);
}


// UI/src/sdk/testing/fetchPools.tsx