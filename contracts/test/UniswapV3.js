hre = require("hardhat");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployUniswapDex} = require("../scripts/utils/deployment");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("../scripts/utils/contract");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

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
        const uniswapAddress = await uniswap.getAddress();
        const WBTC = await hre.ethers.getContractAt("IERC20", addresses.tokens.WBTC);
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);

        await sendERCTokensToUser(addresses.impersonate.WETH, addresses.tokens.WETH, uniswapAddress, hre.ethers.parseEther("2"));

        const wethBalanceBefore = await WETH.balanceOf(uniswapAddress);
        const amountIn = hre.ethers.parseEther("1");
        const deadline = await time.latest() + 10;

        const abiCoder = new hre.ethers.AbiCoder();
        const data = abiCoder.encode(
            ['address', 'address', 'address'],
            [addresses.uniV3.wbtc_eth_pool_0_3, addresses.tokens.WETH,addresses.tokens.WBTC]
        );

        const amountOut = await uniswap.swap.staticCall(
            data,
            amountIn,
            0n,
            addr1,
            deadline
        );

        const tx = await uniswap.swap(
            data,
            amountIn,
            0,
            addr1,
            deadline
        );
        const txReceipt = await tx.wait();

        const wethBalanceAfter = await WETH.balanceOf(uniswapAddress);
        const wbtcBalanceAfter = await WBTC.balanceOf(addr1);

        expect(wbtcBalanceAfter).to.be.equal(amountOut);
        expect(BigInt(wethBalanceAfter)).to.equal(BigInt(wethBalanceBefore) - BigInt(amountIn));
    });

    it("Should revert because of slippage", async function () {
        const {uniswap, addr1} = await deployUniswapDex();

        const uniswapAddress = await uniswap.getAddress();

        await sendERCTokensToUser(addresses.impersonate.WETH, addresses.tokens.WETH, uniswapAddress, hre.ethers.parseEther("2"));

        const amountIn = hre.ethers.parseEther("1");
        const deadline = await time.latest() + 10;

        const abiCoder = new hre.ethers.AbiCoder();
        const data = abiCoder.encode(
            ['address', 'address', 'address'],
            [addresses.uniV3.wbtc_eth_pool_0_3, addresses.tokens.WETH,addresses.tokens.WBTC]
        );

        await expect(uniswap.swap(
            data,
            amountIn,
            hre.ethers.parseEther("2"), // should revert because min amount is too high
            addr1,
            deadline
        )).to.be.revertedWith("Too little received");
    });
});
