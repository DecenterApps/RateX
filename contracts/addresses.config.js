const config = {
    31337: {
        name: "arbitrum",

        wethToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        daiToken: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        usdtToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        wbtcToken: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
        usdcToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        uniToken: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",
        linkToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",

        sushiRouter: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        sushiFactory: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",

        curve2Pool: "0x7f90122BF0700F9E7e1F688fe926940E8839F353", // USDC USDT pool,

        uniQuoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
        univ3_wbtc_eth_pool_0_05: "0x2f5e87C9312fa29aed5c179E456625D79015299c", // 0.05 fee
        univ3_wbtc_eth_pool_0_3: "0x149e36E72726e0BceA5c59d40df2c43F60f5A22D", // 0.3 fee
        sushi_wbtc_eth_pool: "0x515e252b2b5c22b4b2b6Df66c2eBeeA871AA4d69", // 0.3 fee always
    }
}

module.exports = {
    config,
}