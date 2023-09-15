const ARBITRUM_ADDRESSES = {
    name: 'arbitrum',

    tokens: {
        WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        UNI: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
        LINK: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
        USDCE: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        GMX: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
        RDNT: '0x3082cc23568ea640225c2467653db90e9250aaa0'
    },

    sushi: {
        router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
        factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
        wbtc_eth_pool: '0x515e252b2b5c22b4b2b6Df66c2eBeeA871AA4d69',
    },

    camelot: {
        eth_arb_pool: '0xa6c5c7d189fa4eb5af8ba34e63dcdd3a635d433f',
        router: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d'
    },

    curve: {
        curve2Pool: '0x7f90122BF0700F9E7e1F688fe926940E8839F353', // USDCE USDT pool,

        poolRegistry: '0x445FE580eF8d70FF569aB36e80c647af338db351',
        stableSwapFactory: '0xb17b674D9c5CB2e441F8e196a2f048A81355d031',
    },
    
    balancer: {
        vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    },

    uniV3: {
        quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
        quoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',

        wbtc_eth_pool_0_05: '0x2f5e87C9312fa29aed5c179E456625D79015299c', // 0.05 fee
        wbtc_eth_pool_0_3: '0x149e36E72726e0BceA5c59d40df2c43F60f5A22D', // 0.3 fee
        gmx_usdc_pool_0_1: '0x0A36952Fb8C8dc6daeFB2fADb07C5212f560880e',
        uni_weth_pool: '0xC24f7d8E51A64dc1238880BD00bb961D54cbeb29',
        weth_link_pool: '0x468b88941e7Cc0B88c1869d68ab6b570bCEF62Ff',
        weth_usdce_pool_0_3: '0x17c14D2c404D167802b16C450d3c99F88F2c4F4d',
        usdt_usdce_pool_0_0_1: '0x8c9D230D45d6CfeE39a6680Fb7CB7E8DE7Ea8E71',
        weth_usdt_pool_0_3: '0xc82819F72A9e77E2c0c3A69B3196478f44303cf4',
        dai_usdce_pool_0_0_1: '0xF0428617433652c9dc6D1093A42AdFbF30D29f74',
        wbtc_usdce_pool_0_05: '0xac70bD92F89e6739B3a08Db9B6081a923912f73D',
        weth_usdce_pool_0_05: '0xc31e54c7a869b9fcbecc14363cf510d1c41fa443',
        weth_usdt_pool_0_05: '0x641c00a822e8b671738d32a431a4fb6074e5c79d'
    },

    impersonate: {
        WETH: '0x940a7ed683a60220de573ab702ec8f789ef0a402',
        DAI: '0x2d070ed1321871841245d8ee5b84bd2712644322',
        USDT: '0x62383739d68dd0f844103db8dfb05a7eded5bbe6',
        WBTC: "0x7546966122e636a601a3ea4497d3509f160771d8",
        USDC: "0x3dd1d15b3c78d6acfd75a254e857cbe5b9ff0af2",
        RDNT: '0xf977814e90da44bfa03b6295a0616a897441acec'
    }
}

const config = {
    31337: ARBITRUM_ADDRESSES,
    42161: ARBITRUM_ADDRESSES,
}

module.exports = {
    config,
}
