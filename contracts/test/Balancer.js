hre = require("hardhat");
const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployBalancerDex, deployBalancerHelper} = require("../scripts/utils/deployment");
const {sendERCTokensToUser} = require("../scripts/utils/contract");

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

        const [decimals, tokens, balances, weights, swapFeePercentage] =
            await balancerHelper.getWeightedPoolInfo(examplePoolId);

        expect(decimals).to.equals(18);
        expect(tokens.length).to.equals(2);
        expect(balances.length).to.equals(2);
        expect(weights.length).to.equals(2);
        expect(swapFeePercentage).to.equals(5000000000000000n);
    });

    it("Should swap weth for rdnt", async function () {
        const {balancer, addr1} = await deployBalancerDex();
        const balancerAddress = await balancer.getAddress();
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);
        const RDNT = await hre.ethers.getContractAt("IERC20", addresses.tokens.RDNT);

        const amountIn = hre.ethers.parseEther("1");
        const deadline = await time.latest() + 10;
        await sendERCTokensToUser(addresses.impersonate.WETH, addresses.tokens.WETH, balancerAddress, amountIn);
        
        const rdntBalanceBefore = await RDNT.balanceOf(addr1);
        const wethBalanceBefore = await WETH.balanceOf(balancerAddress);

        const abiCoder = new hre.ethers.AbiCoder();
        const data = abiCoder.encode(
            ['address', 'address', 'address'],
            [examplePoolAddress, addresses.tokens.WETH, addresses.tokens.RDNT]
        );

        const amountOut = await balancer.swap.staticCall(
            data,
            amountIn,
            0n,
            addr1,
            deadline
        );

        const tx = await balancer.swap(
            data,
            amountIn,
            0n,
            addr1,
            deadline
        );
        const txReceipt = await tx.wait();

        const wethBalanceAfter = await WETH.balanceOf(balancerAddress);
        const rdntBalanceAfter = await RDNT.balanceOf(addr1);

        expect(rdntBalanceAfter).to.be.equal(rdntBalanceBefore + amountOut);
        expect(BigInt(wethBalanceAfter)).to.be.equal(BigInt(wethBalanceBefore) - BigInt(amountIn));
    });

});
