hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("../scripts/utils");

describe("Tests for swaping with curve.fi", async function () {

    const addresses = config[hre.network.config.chainId];

    async function deployCurveSwapFixture() {
        const [addr1, addr2, addr3] = await hre.ethers.getSigners();

        const CurveSwap = await hre.ethers.getContractFactory("CurveSwapDex", addr1);
        const curveSwap = await CurveSwap.deploy(
            addresses.curve2Pool,
            addresses.usdcToken,
            addresses.usdtToken
        );
        await curveSwap.waitForDeployment();

        return {curveSwap, addr1, addr2, addr3};
    }

    it("Should swap usdc to usdt tokens", async function () {
        const {curveSwap, addr1, addr2} = await loadFixture(deployCurveSwapFixture);

        await sendERCTokensToUser("0x62383739d68dd0f844103db8dfb05a7eded5bbe6", addresses.usdcToken, addr1, "10000000000"); // 10000 USDC
        await approveToContract(addr1, await curveSwap.getAddress(), addresses.usdcToken, hre.ethers.parseEther("10000000000"));

        const usdcContract = await hre.ethers.getContractAt("IERC20", addresses.usdcToken);
        const usdcBalanceBefore = await usdcContract.balanceOf(addr1);
        console.log(`USDC balance before: ${usdcBalanceBefore}`);

        const usdtContract = await hre.ethers.getContractAt("IERC20", addresses.usdtToken);
        const usdtBalanceBefore = await usdtContract.balanceOf(addr1);
        console.log(`USDT balance before: ${usdtBalanceBefore}`);

        await curveSwap.connect(addr1).swap(
            addresses.usdcToken,
            addresses.usdtToken,
            1000000000, // 1000 USDC
            1,
            addr1
        );

        const usdcBalanceAfter = await usdcContract.balanceOf(addr1);
        console.log(`USDC balance after: ${usdcBalanceAfter}`);

        const usdtBalanceAfter = await usdtContract.balanceOf(addr1);
        console.log(`USDT balance after: ${usdtBalanceAfter}`);
    });

});