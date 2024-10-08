hre = require("hardhat");
const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployCamelotDex} = require("../scripts/utils/deployment");
const {sendERCTokensToUser} = require("../scripts/utils/contract");

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

        const camelotAddress = await camelot.getAddress();
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);
        const USDT = await hre.ethers.getContractAt("IERC20", addresses.tokens.USDT);

        const amountIn = hre.ethers.parseEther("50");
        const deadline = await time.latest() + 10;
        await sendERCTokensToUser(addresses.impersonate.WETH, addresses.tokens.WETH, camelotAddress, amountIn);

        const usdtBalanceBefore = await USDT.balanceOf(addr1);
        const wethBalanceBefore = await WETH.balanceOf(camelotAddress);

        const abiCoder = new hre.ethers.AbiCoder();
        const data = abiCoder.encode(
            ['address', 'address'],
            [addresses.tokens.WETH, addresses.tokens.USDT]
        );

        const amountOut = await camelot.swap.staticCall(
            data,
            amountIn,
            0n,
            addr1,
            deadline
        );

        const tx = await camelot.swap(
            data,
            amountIn,
            0n,
            addr1,
            deadline
        );
        const txReceipt = await tx.wait();

        const wethBalanceAfter = await WETH.balanceOf(camelotAddress);
        const usdtBalanceAfter = await USDT.balanceOf(addr1);

        expect(usdtBalanceAfter).to.be.equal(usdtBalanceBefore + amountOut);
        expect(BigInt(wethBalanceAfter)).to.be.equal(BigInt(wethBalanceBefore) - BigInt(amountIn));
    });
});
