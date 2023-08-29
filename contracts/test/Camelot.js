hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {deployCamelotDex} = require("../scripts/utils/deployment");
const {sendWethTokensToUser, approveToContract} = require("../scripts/utils/contract");

describe("Tests for connecting to Camelot V2", async function () {

    const addresses = config[hre.network.config.chainId];


    async function deployCamelotFixture() {
        return (await deployCamelotDex());
    }

    it("Should connect to pool", async function() {
        const {camelot, addr1, addr2} = await loadFixture(deployCamelotFixture);
        const [reserve0, reserve1, token0feePercent, token1FeePercent] = await camelot.getPoolInfo("0xa6c5c7d189fa4eb5af8ba34e63dcdd3a635d433f");
        expect(token0feePercent).to.equals(300n);
        expect(token1FeePercent).to.equals(300n);
    });
});