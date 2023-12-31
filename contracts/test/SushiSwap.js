hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("../scripts/utils/contract");
const {deploySushiDex} = require("../scripts/utils/deployment");

describe("Tests for swaping with sushiswap", async function () {

    const addresses = config[hre.network.config.chainId];

    async function deploySushiSwapFixture() {
        return (await deploySushiDex());
    }

    it("Should swap wei to dai tokens", async function () {
        const {sushiSwap, addr1, addr2} = await loadFixture(deploySushiSwapFixture);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("500"))
        await approveToContract(addr1, await sushiSwap.getAddress(), addresses.tokens.WETH, hre.ethers.parseEther("10000"));

        const wethContract = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);
        const wethBalanceBefore = await wethContract.balanceOf(addr1);
        console.log(`Balance in weth before: ${wethBalanceBefore}`);

        const daiContract = await hre.ethers.getContractAt("IERC20", addresses.tokens.DAI);
        const daiBalanceBefore = await daiContract.balanceOf(addr1);
        console.log(`Dai balance before: ${daiBalanceBefore}`);

        const sushiSwapFactory = await hre.ethers.getContractAt("ISushiSwapV2Factory", addresses.sushi.factory);
        const weiDaiAddress = await sushiSwapFactory.getPair(addresses.tokens.DAI, addresses.tokens.WETH);
        console.log("Wei dai address: ", weiDaiAddress);

        await sushiSwap.connect(addr1).swap(
            addresses.tokens.USDC, // not needed, will be changed later
            addresses.tokens.WETH,
            addresses.tokens.DAI,
            hre.ethers.parseEther("100"),
            1,
            addr1
        );

        const wethBalanceAfter = await wethContract.balanceOf(addr1);
        console.log(`Balance in weth after: ${wethBalanceAfter}`);
        const daiBalanceAfter = await daiContract.balanceOf(addr1);
        console.log(`Dai balance after: ${daiBalanceAfter}`);
    });

    it("Should swap usdc to wei", async function () {
        const {sushiSwap, addr1, addr2} = await loadFixture(deploySushiSwapFixture);

        await sendERCTokensToUser("0x62383739d68dd0f844103db8dfb05a7eded5bbe6", addresses.tokens.USDC, addr1, "10000000000"); // 10000 USDC
        await approveToContract(addr1, await sushiSwap.getAddress(), addresses.tokens.USDC, hre.ethers.parseEther("10000000000"));

        const wethContract = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);
        const wethBalanceBefore = await wethContract.balanceOf(addr1);
        console.log(`Balance in weth before: ${wethBalanceBefore}`);

        const usdcContract = await hre.ethers.getContractAt("IERC20", addresses.tokens.USDC);
        const usdcBalanceBefore = await usdcContract.balanceOf(addr1);
        console.log(`USDC balance before: ${usdcBalanceBefore}`);


        await sushiSwap.connect(addr1).swap(
            addresses.tokens.USDC, // not needed, will be changed later
            addresses.tokens.USDC,
            addresses.tokens.WETH,
            1000000000, // 1000 USDC
            1,
            addr1
        );

        const wethBalanceAfter = await wethContract.balanceOf(addr1);
        console.log(`Balance in weth after: ${wethBalanceAfter}`);
        const usdcBalanceAfter = await usdcContract.balanceOf(addr1);
        console.log(`Usdc balance after: ${usdcBalanceAfter}`);
    });
});