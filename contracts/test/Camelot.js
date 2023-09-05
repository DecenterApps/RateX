hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployCamelotDex, deployCamelotHelper} = require("../scripts/utils/deployment");
const {sendERCTokensToUser, approveToContract} = require("../scripts/utils/contract");

describe("Tests for connecting to Camelot V2", async function () {

    const addresses = config[hre.network.config.chainId];


    async function deployCamelotDexFixture() {
        return (await deployCamelotDex());
    }
    async function deployCamelotHelperFixture() {
        return (await deployCamelotHelper());
    }

    it("Should connect to pool and retrieve info", async function() {
        const {camelotHelper, addr1, addr2} = await loadFixture(deployCamelotHelperFixture);
        const [reserve0, reserve1, token0feePercent, token1FeePercent] = await camelotHelper.getPoolInfo("0xa6c5c7d189fa4eb5af8ba34e63dcdd3a635d433f");
        const stable = await camelotHelper.getStableSwap("0xa6c5c7d189fa4eb5af8ba34e63dcdd3a635d433f");
        expect(stable).to.equals(false);
        expect(token0feePercent).to.equals(300n);
        expect(token1FeePercent).to.equals(300n);
    });

    it("Should swap USDT and wETH", async function() {
        const {camelot, addr1, addr2} = await loadFixture(deployCamelotDexFixture);

        const contractAddress = await camelot.getAddress();
        const accountAddress = await addr1.getAddress();

        const USDT_ADDRESS = addresses.tokens.USDT;
        const WETH_ADDRESS = addresses.tokens.WETH;
        const AMOUNT_IN = 1000000000000n;

        await sendERCTokensToUser(addresses.impersonate.WETH, addresses.tokens.WETH, addr1, AMOUNT_IN); // 2000 WETH
        await approveToContract(addr1, contractAddress, addresses.tokens.WETH, AMOUNT_IN);

        await expect(camelot.swap(
            '0xa6c5c7d189fa4eb5af8ba34e63dcdd3a635d433f', // random address - we don't need pool address
            WETH_ADDRESS,
            USDT_ADDRESS,
            AMOUNT_IN,
            0n,
            accountAddress
        )).to.not.be.revertedWith("Too little received");
    });
});