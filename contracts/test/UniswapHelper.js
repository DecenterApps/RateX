hre = require("hardhat");
const {config} = require("../addresses.config");

const addresses = config[hre.network.config.chainId];

async function deployUniswapQuoter() {
    const quoterUni = await hre.ethers.getContractAt("IQuoterV2", addresses.uniQuoterV2);
    return {quoterUni};
}

async function deployUniswapHelper() {
    const UniswapHelper = await hre.ethers.getContractFactory("UniswapHelper");
    const uniswapHelper = await UniswapHelper.deploy();
    await uniswapHelper.waitForDeployment();
    return {uniswapHelper};
}

// Not real tests, experimenting for now
// TODO:: Make proper tests once logic is finalized
describe("Examples with uniswap helper", function () {

    it("Quoters", async function () {

        const {uniswapHelper} = await deployUniswapHelper();
        const {quoterUni} = await deployUniswapQuoter();

        console.log("=================UNISWAP================");
        console.log("=============================================");

        const params1 = {
            tokenIn: addresses.wethToken,
            tokenOut: addresses.wbtcToken,
            amountIn: hre.ethers.parseEther("100"),
            fee: 3000,
            sqrtPriceLimitX96: 0
        }

        const params2 = {
            tokenIn: addresses.usdcToken,
            tokenOut: addresses.gmxToken,
            amountIn: hre.ethers.parseEther("200"),
            fee: 10000,
            sqrtPriceLimitX96: 0
        }

        const rezUni1 = await quoterUni.quoteExactInputSingle.staticCall(params1);
        const rezUni2 = await quoterUni.quoteExactInputSingle.staticCall(params2);


        console.log("QUOTED AMOUNT 1: " + rezUni1[0]);
        console.log("QUOTED AMOUNT 2: " + rezUni2[0]);

        console.log("=============MY QUOTER=======================");
        console.log("=============================================");

        const rez = await uniswapHelper.estimateAmountOut(
            addresses.univ3_wbtc_eth_pool_0_3,
            addresses.wethToken,
            addresses.wbtcToken,
            hre.ethers.parseEther("100"),
        );
        const rez2 = await uniswapHelper.estimateAmountOut(
            addresses.gmx_usdc_pool_0_1,
            addresses.usdcToken,
            addresses.gmxToken,
            hre.ethers.parseEther("200"),
        );

        console.log("--------------------")
        console.log("QUOTED AMOUNT 1: " + rez);
        console.log("QUOTED AMOUNT 2: " + rez2);
    });

});