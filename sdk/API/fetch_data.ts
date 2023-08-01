import { request } from 'graphql-request'
import { arbitrumQueries } from './constants/queries'
import { arbitrumEndpoins } from './constants/endpoints'

async function fetch_pools(dex_name: string) {
    const query = arbitrumQueries[dex_name]
    const endpoint = arbitrumEndpoins[dex_name]

    const data = await request(endpoint, query)
    console.log(data)
}


fetch_pools('SushiswapV2')