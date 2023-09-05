hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {approveToContract, sendERCTokensToUser} = require("../scripts/utils/contract");
const {deployCurveDex} = require("../scripts/utils/deployment");

const addresses = config[hre.network.config.chainId];

describe("Tests for connecting with Curve", async function () {
    const addresses = config[hre.network.config.chainId];

    async function deployCurveFixture() {
        return (await deployCurveDex());
    }

    it("Should swap with curve2pool", async function () {
        const {curve, addr1, addr2} = await loadFixture(deployCurveFixture);

        const USDT = await hre.ethers.getContractAt("IERC20", addresses.tokens.USDT);
        const USDCE = await hre.ethers.getContractAt("IERC20", addresses.tokens.USDCE);

        const balanceUSDTBefore = await USDT.balanceOf(addr1);
        const balanceUSDCEBefore = await USDCE.balanceOf(addr1);
        console.log(`Balance in USDT before: ${balanceUSDTBefore}`);
        console.log(`Balance in USDCE before: ${balanceUSDCEBefore}`);

        await sendERCTokensToUser(addresses.impersonate.USDT, addresses.tokens.USDT, addr1, "2000000000"); // 2000 USDT
        await approveToContract(addr1, await curve.getAddress(), addresses.tokens.USDT, "10000000000");

        const amountOut = await curve.swap(
            addresses.curve.curve2Pool,
            addresses.tokens.USDT,
            addresses.tokens.USDCE,
            "1000000000", // sending 1000 USDT
            0,
            addr1
        );
        console.log(`Amount out: ${amountOut}`);

        const balanceUSDTAfter = await USDT.balanceOf(addr1);
        const balanceUSDCEAfter = await USDCE.balanceOf(addr1);
        console.log(`Balance in USDT after: ${balanceUSDTAfter}`);
        console.log(`Balance in USDCE after: ${balanceUSDCEAfter}`);
    });
});