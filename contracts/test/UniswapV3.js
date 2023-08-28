hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployUniswapDex} = require("../scripts/utils/deployment");
const {sendWethTokensToUser, approveToContract} = require("../scripts/utils/contract");

describe("Tests for swaping with uniswap v3", async function () {

    const addresses = config[hre.network.config.chainId];

    async function deployUniswapFixture() {
        return (await deployUniswapDex());
    }

    it("Should swap eth for wbtc", async function () {

        const {uniswap, addr1, addr2} = await loadFixture(deployUniswapFixture);
        const quoterContract = await hre.ethers.getContractAt("IQuoter", addresses.uniQuoter);
        const WBTC = await hre.ethers.getContractAt("IERC20", addresses.wbtcToken);
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.wethToken);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("500"))
        await approveToContract(addr1, await uniswap.getAddress(), addresses.wethToken, hre.ethers.parseEther("10000"));

        const wethBalanceBefore = await WETH.balanceOf(addr1);
        console.log(`Balance in weth before: ${wethBalanceBefore}`);

        const wbtcBalanceBefore = await WBTC.balanceOf(addr1);
        console.log(`Balance in wbtc before: ${wbtcBalanceBefore}`);

        const amountIn = hre.ethers.parseEther("1");

        const quotedResult = await quoterContract.quoteExactInputSingle.staticCall(
            addresses.wethToken,
            addresses.wbtcToken,
            3000,
            amountIn,
            0
        );

        await uniswap.swap(
            addresses.univ3_wbtc_eth_pool_0_3,
            addresses.wethToken,
            addresses.wbtcToken,
            amountIn,
            0,
            addr1
        );

        const wethBalanceAfter = await WETH.balanceOf(addr1);
        console.log(`Balance in weth after: ${wethBalanceAfter}`);

        const wbtcBalanceAfter = await WBTC.balanceOf(addr1);
        console.log(`Balance in wbtc after: ${wbtcBalanceAfter}`);

        expect(wbtcBalanceAfter).to.be.equal(quotedResult);
    });

    it("Should revert because of slippage", async function () {
        const {uniswap, addr1, addr2} = await loadFixture(deployUniswapFixture);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("500"))
        await approveToContract(addr1, await uniswap.getAddress(), addresses.wethToken, hre.ethers.parseEther("10000"));

        const amountIn = hre.ethers.parseEther("1");

        await expect(uniswap.swap(
            addresses.univ3_wbtc_eth_pool_0_05,
            addresses.wethToken,
            addresses.wbtcToken,
            amountIn,
            hre.ethers.parseEther("2"),
            addr1
        )).to.be.revertedWith("Too little received");
    });
});