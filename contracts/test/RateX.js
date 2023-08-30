hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("../scripts/utils/contract");
const {deployRateX} = require("../scripts/utils/deployment");

describe("RateX tests", async function () {

    const addresses = config[hre.network.config.chainId];

    async function deployRateXFixture() {
        return (await deployRateX());
    }

    it("Should perform swap with multihop", async function () {
        // route: weth -> usdce -> usdt -> weth -> wbtc. Last pool will go through sushiV2
        const tokenIn = addresses.tokens.WETH;
        const tokenOut = addresses.tokens.WBTC;

        const amountIn = hre.ethers.parseEther("1");

        const {rateX, addr1, addr2} = await loadFixture(deployRateXFixture);
        const WBTC = await hre.ethers.getContractAt("IERC20", addresses.tokens.WBTC);

        const swapStep1 = {
            poolId: addresses.uniV3.weth_usdce_pool_0_3,
            dexId: "UNI_V3",
            tokenA: tokenIn,
            tokenB: addresses.tokens.USDCE
        };
        const swapStep2 = {
            poolId: addresses.uniV3.usdt_usdce_pool_0_0_1,
            dexId: "UNI_V3",
            tokenA: addresses.tokens.USDCE,
            tokenB: addresses.tokens.USDT
        };
        const swapStep3 = {
            poolId: addresses.uniV3.weth_usdt_pool_0_3,
            dexId: "UNI_V3",
            tokenA: addresses.tokens.USDT,
            tokenB: addresses.tokens.WETH
        };

        const swapStep4 = {
            poolId: addresses.sushi.wbtc_eth_pool,
            dexId: "SUSHI_V2",
            tokenA: addresses.tokens.WETH,
            tokenB: tokenOut
        };

        const route = {
            swaps: [swapStep1, swapStep2, swapStep3, swapStep4],
            amountOut: "1", // not used
            percentage: "100", // not used
        };
        await sendWethTokensToUser(addr1, hre.ethers.parseEther("500"))

        await approveToContract(
            addr1,
            await rateX.getAddress(),
            addresses.tokens.WETH,
            hre.ethers.parseEther("10000")
        );

        const balanceBefore = await WBTC.balanceOf(addr1);

        const tx = await rateX.connect(addr1).swapMultiHop(
            route,
            amountIn,
            "1",
            addr1
        );

        const balanceAfter = await WBTC.balanceOf(addr1);

        const txReceipt = await tx.wait();

        // budza, ali izvuce ono sto nam treba
        const eventArgs = txReceipt.logs[txReceipt.logs.length - 1].args

        const tokenInArg = eventArgs[0];
        const tokenOutArg = eventArgs[1];
        const amountInArg = eventArgs[2];
        const amountOutArg = eventArgs[3];
        const recipientAddress = eventArgs[4]

        console.log("tokenInArg: " + tokenInArg);
        console.log("tokenOutArg: " + tokenOutArg);
        console.log("amountInArg: " + amountInArg);
        console.log("amountOutArg: " + amountOutArg);
        console.log("recipientAddress: " + recipientAddress);

        expect(balanceAfter).to.be.equal(amountOutArg);
    });
});