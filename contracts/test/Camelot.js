hre = require("hardhat");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployCamelotDex} = require("../scripts/utils/deployment");
const {approveToContract, sendWethTokensToUser} = require("../scripts/utils/contract");

describe("Tests for Camelot V2", async function () {

    const addresses = config[hre.network.config.chainId];

    let snapshotId;

    beforeEach(async function () {
        snapshotId = await hre.network.provider.send("evm_snapshot");
    });

    afterEach(async function () {
        await hre.network.provider.send("evm_revert", [snapshotId]);
    });

    it("Should swap weth to usdt", async function() {
        const {camelot, addr1} = await deployCamelotDex();
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);
        const USDT = await hre.ethers.getContractAt("IERC20", addresses.tokens.USDT);

        const amountIn = hre.ethers.parseEther("100");
        await sendWethTokensToUser(addr1, amountIn);
        await approveToContract(addr1, await camelot.getAddress(), addresses.tokens.WETH, amountIn);

        const wethBalanceBefore = await WETH.balanceOf(addr1);

        const tx = await camelot.swap(
            "0x0000000000000000000000000000000000000000", // not used in function because we can get pool address from pair
            addresses.tokens.WETH,
            addresses.tokens.USDT,
            amountIn,
            0n,
            addr1
        );
        const txReceipt = await tx.wait();

        const event = txReceipt.logs[txReceipt.logs.length - 1];
        const amountOut = event.args[0];

        const wethBalanceAfter = await WETH.balanceOf(addr1);
        const usdtBalanceAfter = await USDT.balanceOf(addr1);

        expect(usdtBalanceAfter).to.be.equal(amountOut);
        expect(BigInt(wethBalanceAfter)).to.be.equal(BigInt(wethBalanceBefore) - BigInt(amountIn));
    });
});
