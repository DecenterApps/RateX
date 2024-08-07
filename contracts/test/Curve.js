hre = require("hardhat");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {approveToContract, sendERCTokensToUser, sendWethTokensToUser} = require("../scripts/utils/contract");
const {deployCurveDex} = require("../scripts/utils/deployment");

describe("Tests for swapping on Curve", async function () {
    const addresses = config[hre.network.config.chainId];

    let snapshotId;

    beforeEach(async function () {
        snapshotId = await hre.network.provider.send("evm_snapshot");
    });

    afterEach(async function () {
        await hre.network.provider.send("evm_revert", [snapshotId]);
    });

    it("Should swap with curve2pool", async function () {
        const {curve, addr1} = await deployCurveDex();

        const curveAddress = await curve.getAddress();

        const USDT = await hre.ethers.getContractAt("IERC20", addresses.tokens.USDT);
        const USDCE = await hre.ethers.getContractAt("IERC20", addresses.tokens.USDCE);

        const amountIn = hre.ethers.parseUnits("1000", 6);

        await sendERCTokensToUser(addresses.impersonate.USDT, addresses.tokens.USDT, curveAddress, amountIn);

        const balanceUSDTBefore = await USDT.balanceOf(curveAddress);

        const abiCoder = new hre.ethers.AbiCoder();
        const data = abiCoder.encode(
            ['address', 'address', 'address'],
            [addresses.curve.curve2Pool, addresses.tokens.USDT, addresses.tokens.USDCE]
        );

        const tx = await curve.swap(
            data,
            amountIn,
            0,
            addr1,
            0
        );
        const txReceipt = await tx.wait();
        const event = txReceipt.logs[txReceipt.logs.length - 1];
        const amountOut = event.args[0];

        const balanceUSDTAfter = await USDT.balanceOf(curveAddress);
        const balanceUSDCEAfter = await USDCE.balanceOf(addr1);

        expect(balanceUSDCEAfter).to.equal(amountOut);
        expect(BigInt(balanceUSDTAfter)).to.equal(BigInt(balanceUSDTBefore) - BigInt(amountIn));
    });

    it("Should revert because tokens not found in pool", async function () {
        const {curve, addr1} = await deployCurveDex();
        const amountIn = hre.ethers.parseEther("1");

        await sendWethTokensToUser(addr1, amountIn);
        await approveToContract(addr1, await curve.getAddress(), addresses.tokens.WETH, amountIn);

        const abiCoder = new hre.ethers.AbiCoder();
        const data = abiCoder.encode(
            ['address', 'address', 'address'],
            [addresses.curve.curve2Pool, addresses.tokens.WETH, addresses.tokens.USDC]
        );

        await expect(curve.swap(
            data,
            amountIn,
            0,
            addr1,
            0
        )).to.be.revertedWith("Tokens not found in pool");
    });
});
