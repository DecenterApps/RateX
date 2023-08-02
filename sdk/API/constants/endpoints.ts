const SushiV2ArbitrumEndpoint: string = "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange"
const UniV3ArbitrumEndpoint: string = "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-arbitrum"
const TraderJoeV2ArbitrumEndpoint: string = "https://api.thegraph.com/subgraphs/name/traderjoe-xyz/joe-v2-arbitrum"

type ArbitrumEndpoints = {
    [key: string]: string
}

export const arbitrumEndpoins: ArbitrumEndpoints = {
    'SushiswapV2': SushiV2ArbitrumEndpoint,
    'UniswapV3': UniV3ArbitrumEndpoint,
    'TraderJoeV2': TraderJoeV2ArbitrumEndpoint
}