const SushiV2ArbitrumEndpoint: string = "https://api.thegraph.com/subgraphs/name/sushiswap/arbitrum-exchange"
const UniV3ArbitrumEndpoint: string = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3"

type ArbitrumEndpoints = {
    [key: string]: string
}

export const arbitrumEndpoins: ArbitrumEndpoints = {
    'SushiswapV2': SushiV2ArbitrumEndpoint,
    'UniswapV3': UniV3ArbitrumEndpoint
}