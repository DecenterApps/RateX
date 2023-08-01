import { request } from 'graphql-request'
import { arbitrumQueries } from './constants/queries'
import { arbitrumEndpoins } from './constants/endpoints'

const dexNames = ['SushiswapV2', 'UniswapV3'];

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

function pairsList(token1: string, token2: string, dexName: string, jsonList: any){

    let result: any = []
    for(let i = 0; i < jsonList.pairs.length; i++){
        if(jsonList.pairs[i].token0.id == token1 && jsonList.pairs[i].token1.id == token2 ||
            jsonList.pairs[i].token0.id == token2 && jsonList.pairs[i].token1.id == token1)
            result.push(jsonList.pairs[i])
    }
    return result
}

function poolsList(token1: string, token2: string, dexName: string, jsonList: any){

    let result: any = []
    for(let i = 0; i < jsonList.pools.length; i++){
        if(jsonList.pools[i].token0.id == token1 && jsonList.pools[i].token1.id == token2 ||
            jsonList.pools[i].token0.id == token2 && jsonList.pools[i].token1.id == token1)
            result.push(jsonList.pools[i])
    }
    return result
}

async function main() {

    const weth_address = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'.toLowerCase()
    const arbi_address = '0x4f04084721d3008676ad60484cc9269cbdc7d23a'.toLowerCase()
    const usdc_addres = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'.toLowerCase()

    const res = await fetchAllPools()
    // Sushiswap: console.log(res[0].pairs[0])
    // Uniswap: console.log(res[0].pools[0])

    type FilterFunction = {
        [key: string]: (token1: string, token2: string, dexName: string, jsonList: any) => void
    }

    const filterFunction: FilterFunction = {
        'SushiswapV2': pairsList,
        'UniswapV3': poolsList
    }

    let result: any = []
    for(let i = 0; i < 2; i++){
        result.push(filterFunction[dexNames[i]](weth_address, usdc_addres, dexNames[i], res[i]))
    }
    console.log(result)
}
  
main()