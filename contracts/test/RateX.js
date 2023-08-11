hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("../scripts/utils/contract");
const {deployRateX} = require("../scripts/utils/deployment");

describe("Tests for swaping with sushiswap", async function () {

    const addresses = config[hre.network.config.chainId];

    async function deployRateXFixture() {
        return (await deployRateX());
    }

    it("Should swap wei to dai tokens on sushi", async function () {
        const {rateX, addr1, addr2} = await loadFixture(deployRateXFixture);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("500"))
        await approveToContract(addr1, await rateX.getAddress(), addresses.wethToken, hre.ethers.parseEther("10000"));

        const wethContract = await hre.ethers.getContractAt("IWeth", addresses.wethToken);
        const wethBalanceBefore = await wethContract.balanceOf(addr1);
        console.log(`Balance in weth before: ${wethBalanceBefore}`);

        const daiContract = await hre.ethers.getContractAt("IERC20", addresses.daiToken);
        const daiBalanceBefore = await daiContract.balanceOf(addr1);
        console.log(`Dai balance before: ${daiBalanceBefore}`);

        const expectedAmountOut = await rateX.quote('SUSHI_V2', addresses.wethToken, addresses.daiToken, hre.ethers.parseEther("100"));
        console.log(expectedAmountOut);

        await rateX.connect(addr1).swap(
            addresses.sushi_wbtc_eth_pool, // ignored anyway for sushi
            addresses.wethToken,
            addresses.daiToken,
            hre.ethers.parseEther("100"),
            1,
            addr1,
            'SUSHI_V2'
        );

        const wethBalanceAfter = await wethContract.balanceOf(addr1);
        console.log(`Balance in weth after: ${wethBalanceAfter}`);
        const daiBalanceAfter = await daiContract.balanceOf(addr1);
        console.log(`Dai balance after: ${daiBalanceAfter}`);
        console.log("Expected amount: " + expectedAmountOut);

        expect(daiBalanceAfter).to.equal(expectedAmountOut);
    });

    it("Should return quotes for v3 pools and one sushi pool", async function () {

        const {rateX, addr1, addr2} = await loadFixture(deployRateXFixture);

        const sushiPool = await hre.ethers.getContractAt("ISushiSwapV2Pair", addresses.sushi_wbtc_eth_pool);
        const WBTC = await hre.ethers.getContractAt("IERC20", addresses.wbtcToken);
        const WETH = await hre.ethers.getContractAt("IERC20", addresses.wethToken);

        const wbtcReserve05 = await WBTC.balanceOf(addresses.univ3_wbtc_eth_pool_0_05);
        const weiReserve05 = await WETH.balanceOf(addresses.univ3_wbtc_eth_pool_0_05);

        const wbtcReserve3 = await WBTC.balanceOf(addresses.univ3_wbtc_eth_pool_0_3);
        const weiReserve3 = await WETH.balanceOf(addresses.univ3_wbtc_eth_pool_0_3);

        const sushiReserves = await sushiPool.getReserves();
        const wbtcReserveSushi = sushiReserves[0];
        const weiReserveSushi = sushiReserves[1];

        const poolEntries = []
        const entryOne = {
            poolAddress: addresses.univ3_wbtc_eth_pool_0_05,
            dexId: 'UNI_V3',
        };
        const entryTwo = {
            poolAddress: addresses.univ3_wbtc_eth_pool_0_3,
            dexId: 'UNI_V3',
        };
        const entryThree = {
            poolAddress: addresses.sushi_wbtc_eth_pool,
            dexId: 'SUSHI_V2',
        };
        poolEntries.push(entryOne);
        poolEntries.push(entryTwo);
        poolEntries.push(entryThree);


        const balanceBefore = await hre.ethers.provider.getBalance(addr1);
        const result = await rateX.quoteV2.staticCall(poolEntries, addresses.wethToken, addresses.wbtcToken, hre.ethers.parseEther("1"));
        const balanceAfter = await hre.ethers.provider.getBalance(addr1);

        expect(balanceAfter).to.be.equal(balanceBefore); // make sure we don't spend any gas
        expect(result.length).to.equals(3);
        expect(result[0][2]).to.equals(weiReserve05);
        expect(result[0][3]).to.equals(wbtcReserve05);
        expect(result[1][2]).to.equals(weiReserve3);
        expect(result[1][3]).to.equals(wbtcReserve3);
        expect(result[2][2]).to.equals(weiReserveSushi);
        expect(result[2][3]).to.equals(wbtcReserveSushi);

        console.log(result);

    });

    it("Should swap eth for wbtc on uni", async function () {

        const {rateX, addr1, addr2} = await loadFixture(deployRateXFixture);

        const WBTC = await hre.ethers.getContractAt("IERC20", addresses.wbtcToken);
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.wethToken);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("500"))
        await approveToContract(addr1, await rateX.getAddress(), addresses.wethToken, hre.ethers.parseEther("10000"));

        const wethBalanceBefore = await WETH.balanceOf(addr1);
        const wbtcBalanceBefore = await WBTC.balanceOf(addr1);

        const amountIn = hre.ethers.parseEther("1");

        await rateX.swap(
            addresses.univ3_wbtc_eth_pool_0_05,
            addresses.wethToken,
            addresses.wbtcToken,
            amountIn,
            1,
            addr1,
            'UNI_V3'
        );

        const wethBalanceAfter = await WETH.balanceOf(addr1);
        expect(wethBalanceAfter).to.be.equal(wethBalanceBefore - amountIn);
    });
});