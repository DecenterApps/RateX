hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("../scripts/utils");

describe("Tests for swaping with sushiswap", async function () {

    console.log("Chainid:", hre.network.config.chainId);
    const addresses = config[hre.network.config.chainId];

    async function deploySushiSwapFixture() {
        const [addr1, addr2, addr3] = await hre.ethers.getSigners();

        const SushiSwap = await hre.ethers.getContractFactory("SushiSwapDex", addr1);
        const sushiSwap = await SushiSwap.deploy(addresses.sushiRouter);
        await sushiSwap.waitForDeployment();

        return {sushiSwap, addr1, addr2, addr3};
    }

    it("Should swap wei to dai tokens", async function () {
        const {sushiSwap, addr1, addr2} = await loadFixture(deploySushiSwapFixture);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("500"))
        await approveToContract(addr1, await sushiSwap.getAddress(), addresses.wethToken, hre.ethers.parseEther("10000"));

        const wethContract = await hre.ethers.getContractAt("IWeth", addresses.wethToken);
        const wethBalanceBefore = await wethContract.balanceOf(addr1);
        console.log(`Balance in weth before: ${wethBalanceBefore}`);

        const daiContract = await hre.ethers.getContractAt("IERC20", addresses.daiToken);
        const daiBalanceBefore = await daiContract.balanceOf(addr1);
        console.log(`Dai balance before: ${daiBalanceBefore}`);

        await sushiSwap.connect(addr1).swap(
            addresses.wethToken,
            addresses.daiToken,
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

        await sendERCTokensToUser("0x62383739d68dd0f844103db8dfb05a7eded5bbe6", addresses.usdcToken, addr1, "10000000000"); // 10000 USDC
        await approveToContract(addr1, await sushiSwap.getAddress(), addresses.usdcToken, hre.ethers.parseEther("10000000000"));

        const wethContract = await hre.ethers.getContractAt("IWeth", addresses.wethToken);
        const wethBalanceBefore = await wethContract.balanceOf(addr1);
        console.log(`Balance in weth before: ${wethBalanceBefore}`);

        const usdcContract = await hre.ethers.getContractAt("IERC20", addresses.usdcToken);
        const usdcBalanceBefore = await usdcContract.balanceOf(addr1);
        console.log(`USDC balance before: ${usdcBalanceBefore}`);

        await sushiSwap.connect(addr1).swap(
            addresses.usdcToken,
            addresses.wethToken,
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