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


    it("Should get right quote for v3 pool", async function () {
        const {uniswap, addr1, addr2} = await loadFixture(deployUniswapFixture);

        const WBTC = await hre.ethers.getContractAt("IERC20", addresses.wbtcToken);
        const WETH = await hre.ethers.getContractAt("IERC20", addresses.wethToken);
        const poolContract = await hre.ethers.getContractAt("IUniswapV3Pool", addresses.univ3_wbtc_eth_pool_0_05);
        const quoterContract = await hre.ethers.getContractAt("IQuoter", addresses.uniQuoter);
        const wbtcReserve = await WBTC.balanceOf(addresses.univ3_wbtc_eth_pool_0_05);
        const wethReserve = await WETH.balanceOf(addresses.univ3_wbtc_eth_pool_0_05);

        const fee = await poolContract.fee();
        const balanceBefore = await hre.ethers.provider.getBalance(addr1);

        let start1 = Date.now();
        const rez1 = await quoterContract.quoteExactInputSingle.staticCall(addresses.wethToken, addresses.wbtcToken, fee, hre.ethers.parseEther("1"), 0);
        let timeTakenRez1 = Date.now() - start1;

        let start2 = Date.now();
        const rez2 = await uniswap.quoteV2.staticCall(addresses.univ3_wbtc_eth_pool_0_05, addresses.wethToken, addresses.wbtcToken, hre.ethers.parseEther("1"));
        let timeTakenRez2 = Date.now() - start2;

        console.log(`Rez1: ${rez1}. Time taken: ${timeTakenRez1}`);
        console.log(`Rez2: ${rez2[2]}. Time taken: ${timeTakenRez2}`);

        const balanceAfter = await hre.ethers.provider.getBalance(addr1);

        expect(balanceAfter).to.be.equal(balanceBefore);
        expect(rez1).to.equal(rez2[2]);
        expect(rez2[0]).to.equal(wethReserve);
        expect(rez2[1]).to.equal(wbtcReserve);
    });

    it("Should swap eth for wbtc", async function () {

        const {uniswap, addr1, addr2} = await loadFixture(deployUniswapFixture);

        const WBTC = await hre.ethers.getContractAt("IERC20", addresses.wbtcToken);
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.wethToken);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("500"))
        await approveToContract(addr1, await uniswap.getAddress(), addresses.wethToken, hre.ethers.parseEther("10000"));

        const wethBalanceBefore = await WETH.balanceOf(addr1);
        console.log(`Balance in weth before: ${wethBalanceBefore}`);

        const wbtcBalanceBefore = await WBTC.balanceOf(addr1);
        console.log(`Balance in wbtc before: ${wbtcBalanceBefore}`);

        const amountIn = hre.ethers.parseEther("1");

        const [,,quoterResult] = await uniswap.quoteV2.staticCall(
            addresses.univ3_wbtc_eth_pool_0_05,
            addresses.wethToken,
            addresses.wbtcToken,
            amountIn
        );

        await uniswap.swap(
            addresses.univ3_wbtc_eth_pool_0_05,
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

        expect(wethBalanceAfter).to.be.equal(wethBalanceBefore - amountIn);
        expect(wbtcBalanceAfter).to.be.equal(quoterResult);
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