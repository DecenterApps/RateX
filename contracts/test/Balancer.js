hre = require("hardhat");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployBalancerDex, deployBalancerHelper} = require("../scripts/utils/deployment");
const {sendWethTokensToUser, approveToContract} = require("../scripts/utils/contract");

describe("Tests for Balancer", async function () {
    const addresses = config[hre.network.config.chainId];

    let snapshotId;

    beforeEach(async function () {
        snapshotId = await hre.network.provider.send("evm_snapshot");
    });

    afterEach(async function () {
        await hre.network.provider.send("evm_revert", [snapshotId]);
    });

    const examplePoolId = "0x32df62dc3aed2cd6224193052ce665dc181658410002000000000000000003bd";
    const examplePoolAddress = "0x32dF62dc3aEd2cD6224193052Ce665DC18165841";

    it("Should get weighted pool info", async function () {
        const {balancerHelper} = await deployBalancerHelper();

        const [decimals, invariant, tokens, balances, weights, swapFeePercentage] =
            await balancerHelper.getWeightedPoolInfo(examplePoolId);

        expect(decimals).to.equals(18);
        expect(tokens.length).to.equals(2);
        expect(balances.length).to.equals(2);
        expect(weights.length).to.equals(2);
        expect(swapFeePercentage).to.equals(5000000000000000n);
    });

    it("Should swap weth for rdnt", async function () {
        const {balancer, addr1} = await deployBalancerDex();
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);
        const RDNT = await hre.ethers.getContractAt("IERC20", addresses.tokens.RDNT);

        const amountIn = hre.ethers.parseEther("1");
        await sendWethTokensToUser(addr1, amountIn);
        await approveToContract(addr1, await balancer.getAddress(), addresses.tokens.WETH, amountIn);

        const wethBalanceBefore = await WETH.balanceOf(addr1);

        const tx = await balancer.swap(
            examplePoolAddress,
            addresses.tokens.WETH,
            addresses.tokens.RDNT,
            amountIn,
            0n,
            addr1
        );
        const txReceipt = await tx.wait();
        const event = txReceipt.logs[txReceipt.logs.length - 1];
        const amountOut = event.args[0];

        const wethBalanceAfter = await WETH.balanceOf(addr1);
        const rdntBalanceAfter = await RDNT.balanceOf(addr1);

        expect(rdntBalanceAfter).to.be.equal(amountOut);
        expect(BigInt(wethBalanceAfter)).to.be.equal(BigInt(wethBalanceBefore) - BigInt(amountIn));
    });

});
