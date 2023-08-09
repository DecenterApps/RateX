hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployUniswapDex} = require("../scripts/utils/deployment");

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
});