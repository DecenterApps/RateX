hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("../scripts/utils");

describe("Tests for swaping with sushiswap", async function () {

    console.log("Chainid:", hre.network.config.chainId);
    const addresses = config[hre.network.config.chainId];

    async function deploySushiDex() {
        const [addr1, addr2, addr3] = await hre.ethers.getSigners();

        const Lib = await hre.ethers.getContractFactory("SushiSwapV2Library");
        const lib = await Lib.deploy();
        await lib.waitForDeployment();
        const libAddr = await lib.getAddress();

        const SushiSwap = await hre.ethers.getContractFactory("SushiSwapDex", {
            signer: addr1,
            libraries: {
                SushiSwapV2Library: libAddr
            }
        });
        const sushiSwap = await SushiSwap.deploy(addresses.sushiRouter, addresses.sushiFactory);
        await sushiSwap.waitForDeployment();
        const sushiSwapAddress = await sushiSwap.getAddress();

        return {sushiSwapAddress};
    }

    async function deployRateXFixture() {
        const [addr1, addr2, addr3] = await hre.ethers.getSigners();
        const { sushiSwapAddress} = await deploySushiDex();

        const RateX = await hre.ethers.getContractFactory("RateX");
        const rateX = await RateX.deploy(sushiSwapAddress);
        await rateX.waitForDeployment();

        return {rateX, addr1, addr2, addr3};
    }

    it("Should swap wei to dai tokens", async function () {
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
});