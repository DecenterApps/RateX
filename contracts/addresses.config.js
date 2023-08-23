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
        usdceToken: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",

        sushiRouter: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        sushiFactory: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",

        Curve: {
            curve2Pool: "0x7f90122BF0700F9E7e1F688fe926940E8839F353", // USDC USDT pool,
            curve_wBTC_renBTCPool: "0x3E01dD8a5E1fb3481F0F589056b428Fc308AF0Fb",
            eurusd: "0xA827a652Ead76c6B0b3D19dba05452E06e25c27e",
            wsteth: "0x6eB2dc694eB516B16Dc9FBc678C60052BbdD7d80",
            // tricryptoPool: "0x960ea3e3C7FB317332d990873d354E18d7645590", WE CANT DO THIS FOR NOW BECAUSE OF THE 3 TOKENS
        },
        stableSwapFactory: "0xb17b674D9c5CB2e441F8e196a2f048A81355d031", // Gas

        balancerVault: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",

        uniQuoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
        uniRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        univ3_wbtc_eth_pool_0_05: "0x2f5e87C9312fa29aed5c179E456625D79015299c", // 0.05 fee
        univ3_wbtc_eth_pool_0_3: "0x149e36E72726e0BceA5c59d40df2c43F60f5A22D", // 0.3 fee
        sushi_wbtc_eth_pool: "0x515e252b2b5c22b4b2b6Df66c2eBeeA871AA4d69", // 0.3 fee always

        impersonate_weth: "0x0df5dfd95966753f01cb80e76dc20ea958238c46",
        impersonate_dai: "0xd85e038593d7a098614721eae955ec2022b9b91b"
    },
    42161: {
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

        uniQuoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
        uniRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        univ3_wbtc_eth_pool_0_05: "0x2f5e87C9312fa29aed5c179E456625D79015299c", // 0.05 fee
        univ3_wbtc_eth_pool_0_3: "0x149e36E72726e0BceA5c59d40df2c43F60f5A22D", // 0.3 fee
        sushi_wbtc_eth_pool: "0x515e252b2b5c22b4b2b6Df66c2eBeeA871AA4d69", // 0.3 fee always

        impersonate_weth: "0x0df5dfd95966753f01cb80e76dc20ea958238c46",
        impersonate_dai: "0xd85e038593d7a098614721eae955ec2022b9b91b"
    }
}

module.exports = {
    config,
}