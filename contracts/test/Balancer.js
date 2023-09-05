hre = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai")
const { config } = require("../addresses.config");
const { deployBalancerDex, deployBalancerHelper } = require("../scripts/utils/deployment");

describe("Tests for connecting with Balancer", async function () {
    const addresses = config[hre.network.config.chainId];

    const examplePoolId = "0x32df62dc3aed2cd6224193052ce665dc181658410002000000000000000003bd";
    const examplePoolAddress = "0x32dF62dc3aEd2cD6224193052Ce665DC18165841";

    async function deployBalancerDexFixture() {
        return (await deployBalancerDex());
    }
    async function deployBalancerHelperFixture() {
        return (await deployBalancerHelper())
    }

    it("Should retrieve pool address from id", async function () {
        const { balancer, addr1, addr2 } = await loadFixture(deployBalancerDexFixture);
        const poolAddress = await balancer.getPool(examplePoolId);
        expect(poolAddress).to.equals(examplePoolAddress);
    });

    it("Should get weighted pool info", async function () {
        const {balancerHelper, addr1, addr2} = await loadFixture(deployBalancerHelperFixture);
        

        const [decimals, invariant, tokens, balances, weights, swapFeePercentage] = await balancerHelper.getWeightedPoolInfo(examplePoolId);

        expect(decimals).to.equals(18);
        expect(tokens.length).to.equals(2);
        expect(balances.length).to.equals(2);
        expect(weights.length).to.equals(2);
        expect(swapFeePercentage).to.equals(5000000000000000n);
    });

});