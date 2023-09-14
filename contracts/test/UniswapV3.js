hre = require("hardhat");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployUniswapDex} = require("../scripts/utils/deployment");
const {sendWethTokensToUser, approveToContract} = require("../scripts/utils/contract");

describe("Tests for swapping on uniswap v3", async function () {

    const addresses = config[hre.network.config.chainId];

    let snapshotId;

    beforeEach(async function () {
        snapshotId = await hre.network.provider.send("evm_snapshot");
    });

    afterEach(async function () {
        await hre.network.provider.send("evm_revert", [snapshotId]);
    });

    it("Should swap eth for wbtc", async function () {

        const {uniswap, addr1} = await deployUniswapDex();
        const WBTC = await hre.ethers.getContractAt("IERC20", addresses.tokens.WBTC);
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("2"))
        await approveToContract(addr1, await uniswap.getAddress(), addresses.tokens.WETH, hre.ethers.parseEther("1"));

        const wethBalanceBefore = await WETH.balanceOf(addr1);
        const amountIn = hre.ethers.parseEther("1");

        const tx = await uniswap.swap(
            addresses.uniV3.wbtc_eth_pool_0_3,
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            amountIn,
            0,
            addr1
        );
        const txReceipt = await tx.wait();
        const event = txReceipt.logs[txReceipt.logs.length - 1];
        const amountOut = event.args[0];

        const wethBalanceAfter = await WETH.balanceOf(addr1);
        const wbtcBalanceAfter = await WBTC.balanceOf(addr1);

        expect(wbtcBalanceAfter).to.be.equal(amountOut);
        expect(BigInt(wethBalanceAfter)).to.equal(BigInt(wethBalanceBefore) - BigInt(amountIn));
    });

    it("Should revert because of slippage", async function () {
        const {uniswap, addr1} = await deployUniswapDex();

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("2"))
        await approveToContract(addr1, await uniswap.getAddress(), addresses.tokens.WETH, hre.ethers.parseEther("2"));

        const amountIn = hre.ethers.parseEther("1");

        await expect(uniswap.swap(
            addresses.uniV3.wbtc_eth_pool_0_05,
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            amountIn,
            hre.ethers.parseEther("2"), // should revert because min amount is too high
            addr1
        )).to.be.revertedWith("Too little received");
    });
});
