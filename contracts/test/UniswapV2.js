hre = require("hardhat");
const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendERCTokensToUser} = require("../scripts/utils/contract");
const {deployUniswapV2Dex} = require("../scripts/utils/deployment");

describe("Tests for swapping on uniswapV2", async function () {

    const addresses = config[hre.network.config.chainId];

    let snapshotId;

    beforeEach(async function () {
        snapshotId = await hre.network.provider.send("evm_snapshot");
    });

    afterEach(async function () {
        await hre.network.provider.send("evm_revert", [snapshotId]);
    });

    it("Should swap wei to dai tokens", async function () {
        const {uniswapV2, addr1} = await deployUniswapV2Dex();
        
        const uniswapAddress = await uniswapV2.getAddress();
        const amountIn = hre.ethers.parseEther("50");
        const deadline = await time.latest() + 10;
       
        const WETH = await hre.ethers.getContractAt("IWeth", addresses.tokens.WETH);
        const DAI = await hre.ethers.getContractAt("IERC20", addresses.tokens.DAI);
        await sendERCTokensToUser(addresses.impersonate.WETH, addresses.tokens.WETH, uniswapAddress, amountIn);

        const daiBalanceBefore = await DAI.balanceOf(addr1);
        const wethBalanceBefore = await WETH.balanceOf(uniswapAddress);

        const abiCoder = new hre.ethers.AbiCoder();
        const data = abiCoder.encode(
            ['address', 'address'],
            [addresses.tokens.WETH, addresses.tokens.DAI]
        );

        const amountOut = await uniswapV2.swap.staticCall(
            data,
            amountIn,
            0n,
            addr1,
            deadline
        );

        const tx = await uniswapV2.swap(
            data,
            amountIn,
            1,
            addr1,
            deadline
        );
        const txReceipt = await tx.wait();

        const wethBalanceAfter = await WETH.balanceOf(uniswapAddress);
        const daiBalanceAfter = await DAI.balanceOf(addr1);

        expect(daiBalanceAfter).to.be.equal(daiBalanceBefore + amountOut);
        expect(BigInt(wethBalanceAfter)).to.equal(BigInt(wethBalanceBefore) - BigInt(amountIn));
    });
});
