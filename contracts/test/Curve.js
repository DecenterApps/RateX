hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser, getSymbolAndDecimalsOfERC20Token} = require("../scripts/utils/contract");
const {deployCurveDex} = require("../scripts/utils/deployment");

const addresses = config[hre.network.config.chainId];

describe("Tests for connecting with Curve", async function () {
    const addresses = config[hre.network.config.chainId];

    async function deployCurveFixture() {
        return (await deployCurveDex());
    }

    it("Should connect with curve pool", async function () {
        const {curve, addr1, addr2} = await loadFixture(deployCurveFixture);
        console.log(await curve.printHelloWorld());
    });

    it("Should get expected amount", async function () {
        const {curve, addr1, addr2} = await loadFixture(deployCurveFixture);

        const usdtToken = addresses.usdtToken;
        const usdceToken = addresses.usdceToken;
        const amountOut = await curve.getAmountOut(usdtToken, usdceToken, 1000000);

        console.log("Expected amount out: ", BigInt(amountOut).toString());
    });

    it("Should get pool info", async function () {
        const {curve, addr1, addr2} = await loadFixture(deployCurveFixture);

        const [decimals, A, fee, balances] = await curve.getPoolInfo();

        console.log("Decimals: ", decimals);
        console.log("A: ", A);
        console.log("Fee: ", fee);
        console.log("Balances: ", balances);
    });
});