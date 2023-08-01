import { request } from 'graphql-request'
import { arbitrumQueries } from './constants/queries'
import { arbitrumEndpoins } from './constants/endpoints'
import { wETH_address, USDC_address } from './constants/tokens'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const dexNames = ['SushiswapV2', 'UniswapV3'];

let pools: any[] = []

function SushiswapV2List(token0: string, token1: string, dexName: string, jsonList: any){

    let result: any = []
    // console.log(jsonList.pairs[0])
    for(let i = 0; i < jsonList.pairs.length; i++){
        if((jsonList.pairs[i].token0.id == token0 && jsonList.pairs[i].token1.id == token1) ||
            (jsonList.pairs[i].token0.id == token1 && jsonList.pairs[i].token1.id == token0))
            result.push(jsonList.pairs[i])
    }
    return result
}

function UniswapV3List(token0: string, token1: string, dexName: string, jsonList: any){
    // TODO
    let result: any = []
    console.log(jsonList.pools.length)
    for(let i = 0; i < jsonList.pools.length; i++){
        // console.log(jsonList.pools[i].token0.id, token1)
        if((jsonList.pools[i].token0.id == token0 && jsonList.pools[i].token1.id == token1) ||
            (jsonList.pools[i].token0.id == token1 && jsonList.pools[i].token1.id == token0))
            result.push(jsonList.pools[i])
    }
    return result
}

async function fetch_pools(dex_name: string) {
    const query = arbitrumQueries[dex_name]
    const endpoint = arbitrumEndpoins[dex_name]

    return await request(endpoint, query)
}

async function fetchAllPools() {

    const promises: Promise<any>[] = []; 
    for (let i = 0; i < 2; i++) {
      promises.push(fetch_pools(dexNames[i]));
    }
  
    // Use Promise.all to await all promises concurrently
    const results = await Promise.all(promises);
  
    return results;
}

async function updatePools(refreshTime: number = 0) {
    let lastDate = new Date()

    // Update pools every refreshTime ms
    while (true) {
        const res = await fetchAllPools() // fetch new pools
        pools = res // update pools
        
        // Sleep if we are faster than the refresh time
        let newDate = new Date()    // get current time
        const timeDifference = (newDate.getTime() - lastDate.getTime()) // time difference in ms
        if (refreshTime > timeDifference) {
            await sleep(refreshTime - timeDifference) // sleep for the difference
        }
    }
}

async function main() {
    updatePools(0)
    while (pools.length == 0) {
        await sleep(1000)
    }

    console.log(SushiswapV2List(wETH_address, USDC_address, dexNames[0], pools[0]))
}
  
main()