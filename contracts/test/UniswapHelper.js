hre = require("hardhat");
const {config} = require("../addresses.config");

const addresses = config[hre.network.config.chainId];

async function deployUniswapQuoter() {
    const quoterUni = await hre.ethers.getContractAt("IQuoterV2", addresses.uniQuoterV2);
    return {quoterUni};
}

async function deployTestQuoter() {
    const Quoter = await hre.ethers.getContractFactory("QuoterTest");
    const quoter = await Quoter.deploy();
    await quoter.waitForDeployment();
    return {quoter};
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

        const {quoter} = await deployTestQuoter();
        const {quoterUni} = await deployUniswapQuoter();

        console.log("=================UNISWAP================");
        console.log("=============================================");

        // const params1 = {
        //     tokenIn: addresses.gmxToken,
        //     tokenOut: addresses.usdcToken,
        //     amountIn: hre.ethers.parseEther("200"),
        //     fee: 10000,
        //     sqrtPriceLimitX96: 0
        // }
        const params1 = {
            tokenIn: addresses.wethToken,
            tokenOut: addresses.wbtcToken,
            amountIn: hre.ethers.parseEther("100"),
            fee: 3000,
            sqrtPriceLimitX96: 0
        }

        const rezUni1 = await quoterUni.quoteExactInputSingle.staticCall(params1);

        // const params2 = {
        //     tokenIn: addresses.usdcToken,
        //     tokenOut: addresses.gmxToken,
        //     amountIn: hre.ethers.parseEther("200"),
        //     fee: 10000,
        //     sqrtPriceLimitX96: 0
        // }

        // const params2 = {
        //     tokenIn: addresses.wbtcToken,
        //     tokenOut: addresses.wethToken,
        //     amountIn: "1000000000",
        //     fee: 3000,
        //     sqrtPriceLimitX96: 0
        // }
        // const rezUni2 = await quoterUni.quoteExactInputSingle.staticCall(params2);
        //
        console.log("QUOTED AMOUNT 1: " + rezUni1[0]);
        console.log("CROSSED TICKS 1: " + rezUni1[2]);
        //console.log("QUOTED AMOUNT 2: " + rezUni2[0]);



        console.log("=============MY QUOTER=======================");
        console.log("=============================================");

        // const rez = await quoter.estimateAmountOut(
        //     addresses.gmxToken,
        //     addresses.usdcToken,
        //     hre.ethers.parseEther("200"),
        //     10000
        // );

        const rez = await quoter.estimateAmountOut(
            addresses.wethToken,
            addresses.wbtcToken,
            hre.ethers.parseEther("100"),
            3000
        );
        console.log("====================================");
        // const rez2 = await quoter.estimateAmountOut(
        //     addresses.usdcToken,
        //     addresses.gmxToken,
        //     hre.ethers.parseEther("200"),
        //     10000
        // );

        // const rez2 = await quoter.estimateAmountOut(
        //     addresses.wbtcToken,
        //     addresses.wethToken,
        //     "1000000000",
        //     3000
        // );

        console.log("--------------------")
        console.log("QUOTED AMOUNT 1: " + rez);
        // console.log("QUOTED AMOUNT 2: " + rez2);
        console.log("--------------------");
    });

    // it("Test getting data for offchain quoter", async function () {
    //     const _pools = [
    //                addresses.univ3_wbtc_eth_pool_0_3,
    //         //       addresses.univ3_wbtc_eth_pool_0_05,
    //         //addresses.gmx_usdc_pool_0_1
    //         //       addresses.uni_weth_pool,
    //         //       addresses.weth_link_pool
    //     ];
    //
    //     const {offchainQuoter} = await deployOffchainQuoter();
    //
    //     const startTime = Date.now();
    //     const rez = await offchainQuoter.fetchData(_pools, 10);
    //     const endTime = Date.now();
    //
    //     // const poolDataZero = rez[0];
    //     // const poolInfo = poolDataZero[0];
    //     // const zeroForOneTicks = poolDataZero[1];
    //     // const oneForZeroTicks = poolDataZero[2];
    //     //
    //     // console.log("Time for execution: ", endTime - startTime);
    //     // console.log("Zero for one ticks");
    //     // console.log("--------------------");
    //     // for (let i = 0; i < zeroForOneTicks.length; i++) {
    //     //     const tickData = zeroForOneTicks[i];
    //     //     const tick = tickData[0];
    //     //     const initialized = tickData[1];
    //     //     const liquidityNet = tickData[2];
    //     //
    //     //     console.log("Tick: ", tick);
    //     //     console.log("Initialized: ", initialized);
    //     //     console.log("Liquidity net: ", liquidityNet);
    //     // }
    //     //
    //     // console.log("One for zero ticks");
    //     // console.log("--------------------");
    //     // for (let i = 0; i < oneForZeroTicks.length; i++) {
    //     //     const tickData = oneForZeroTicks[i];
    //     //     const tick = tickData[0];
    //     //     const initialized = tickData[1];
    //     //     const liquidityNet = tickData[2];
    //     //
    //     //     console.log("Tick: ", tick);
    //     //     console.log("Initialized: ", initialized);
    //     //     console.log("Liquidity net: ", liquidityNet);
    //     // }
    // });

    it("Test uniswap helper offchain like method", async function () {
        const {uniswapHelper} = await deployUniswapHelper();


        // const rez1 = await uniswapHelper.quote(
        //     addresses.gmx_usdc_pool_0_1,
        //     addresses.gmxToken,
        //     addresses.usdcToken,
        //     hre.ethers.parseEther("10"),
        //     10
        // );

        // const rez2 = await uniswapHelper.quote(
        //     addresses.gmx_usdc_pool_0_1,
        //     addresses.usdcToken,
        //     addresses.gmxToken,
        //     hre.ethers.parseEther("10"),
        //     10
        // );
        //
        const rez1 = await uniswapHelper.quote(
            addresses.univ3_wbtc_eth_pool_0_3,
            addresses.wethToken,
            addresses.wbtcToken,
            hre.ethers.parseEther("100"),
            15
        );
        // const rez2 = await uniswapHelper.quote(
        //     addresses.univ3_wbtc_eth_pool_0_3,
        //     addresses.wbtcToken,
        //     addresses.wethToken,
        //     "1000000000",
        //     10
        // );

        console.log("===================OFFCHAIN QUOTER===========================");
        console.log("quote1: ", rez1[0]);
        console.log("remainder1: ", rez1[1]);
        // console.log("quote2: ", rez2[0]);
        // console.log("remainder2: ", rez2[1]);
    });

});