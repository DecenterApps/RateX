hre = require("hardhat");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("../scripts/utils/contract");
const {deploySushiDex} = require("../scripts/utils/deployment");

describe("Tests for swapping on sushiswap", async function () {

    const addresses = config[hre.network.config.chainId];

    let snapshotId;

    beforeEach(async function () {
        snapshotId = await hre.network.provider.send("evm_snapshot");
    });

    afterEach(async function () {
        await hre.network.provider.send("evm_revert", [snapshotId]);
    });

    it("Should swap wei to dai tokens", async function () {
        const {sushiSwap, addr1} = await deploySushiDex();

        const amountIn = hre.ethers.parseEther("100");
        await sendWethTokensToUser(addr1, amountIn);
        await approveToContract(addr1, await sushiSwap.getAddress(), addresses.tokens.WETH, amountIn);

        const WETH = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);
        const DAI = await hre.ethers.getContractAt("IERC20", addresses.tokens.DAI);

        const wethBalanceBefore = await WETH.balanceOf(addr1);

        const tx = await sushiSwap.swap(
            "0x0000000000000000000000000000000000000000", // not used in function because we can get pool address from pair
            addresses.tokens.WETH,
            addresses.tokens.DAI,
            amountIn,
            1,
            addr1
        );
        const txReceipt = await tx.wait();

        const event = txReceipt.logs[txReceipt.logs.length - 1];
        const amountOut = event.args[0];

        const wethBalanceAfter = await WETH.balanceOf(addr1);
        const daiBalanceAfter = await DAI.balanceOf(addr1);

        expect(daiBalanceAfter).to.be.equal(amountOut);
        expect(BigInt(wethBalanceAfter)).to.equal(BigInt(wethBalanceBefore) - BigInt(amountIn));
    });
});
