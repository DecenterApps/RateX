hre = require("hardhat");
const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
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

    it("Should swap weth to dai tokens", async function () {
        const {sushiSwap, addr1} = await deploySushiDex();
        const sushiSwapAddress = await sushiSwap.getAddress();

        const amountIn = hre.ethers.parseEther("50");
        const deadline = await time.latest() + 10;
        await sendERCTokensToUser(addresses.impersonate.WETH, addresses.tokens.WETH, sushiSwapAddress, amountIn);

        const WETH = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);
        const DAI = await hre.ethers.getContractAt("IERC20", addresses.tokens.DAI);

        const daiBalanceBefore = await DAI.balanceOf(addr1);
        const wethBalanceBefore = await WETH.balanceOf(sushiSwapAddress);

        const abiCoder = new hre.ethers.AbiCoder();
        const data = abiCoder.encode(
            ['address', 'address'],
            [addresses.tokens.WETH, addresses.tokens.DAI]
        );

        const amountOut = await sushiSwap.swap.staticCall(
            data,
            amountIn,
            0n,
            addr1,
            deadline
        );

        const tx = await sushiSwap.swap(
            data,
            amountIn,
            1,
            addr1,
            deadline
        );
        const txReceipt = await tx.wait();

        const wethBalanceAfter = await WETH.balanceOf(sushiSwapAddress);
        const daiBalanceAfter = await DAI.balanceOf(addr1);

        expect(daiBalanceAfter).to.be.equal(daiBalanceBefore + amountOut);
        expect(BigInt(wethBalanceAfter)).to.equal(BigInt(wethBalanceBefore) - BigInt(amountIn));
    });
});
