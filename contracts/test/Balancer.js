hre = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai")
const { config } = require("../addresses.config");
const { deployBalancerDex } = require("../scripts/utils/deployment");

describe("Tests for connecting with Balancer", async function () {
    const addresses = config[hre.network.config.chainId];

    const examplePoolId = "0x32df62dc3aed2cd6224193052ce665dc181658410002000000000000000003bd";
    const examplePoolAddress = "0x32dF62dc3aEd2cD6224193052Ce665DC18165841";

    async function deployBalancerFixture() {
        return (await deployBalancerDex());
    }

    it("Should retrieve pool address from id", async function () {
        const { balancer, addr1, addr2 } = await loadFixture(deployBalancerFixture);
        const poolAddress = await balancer.getPool(examplePoolId);
        expect(poolAddress).to.equals(examplePoolAddress);
    });

    it("Should get weighted pool info", async function () {
        const {balancer, addr1, addr2} = await loadFixture(deployBalancerFixture);

        const [decimals, invariant, tokens, balances, weights, swapFeePercentage] = await balancer.getWeightedPoolInfo(examplePoolId);

        expect(decimals).to.equals(18);
        expect(tokens.length).to.equals(2);
        expect(balances.length).to.equals(2);
        expect(weights.length).to.equals(2);
        expect(swapFeePercentage).to.equals(5000000000000000n);

        /* 
        console.log("       Decimals : ", decimals);
        console.log("       Tokens: ", tokens);
        console.log("       Invariant: ", invariant);
        console.log("       Balances : ", balances);
        console.log("       Weights  : ", weights);
        */
    });

    it("Should get stable pool info", async function () {
        stablePoolId = "0x36bf227d6bac96e2ab1ebb5492ecec69c691943f000200000000000000000316";
        const {balancer, addr1, addr2} = await loadFixture(deployBalancerFixture);

        const [decimals, tokens, balances, aValue, aPrecision, swapFeePercentage] = await balancer.getStablePoolInfo(stablePoolId);

        expect(decimals).to.equals(18);
        expect(tokens.length).to.equals(2);
        expect(balances.length).to.equals(2);
        expect(aValue).to.equals(50000);
        expect(aPrecision).to.equals(1000);
        expect(swapFeePercentage).to.equals(10000000000000n);

        /* 
        console.log("       Decimals : ", decimals);
        console.log("       Tokens: ", tokens);
        console.log("       Balances : ", balances);
        console.log("       A  : ", aValue);
        console.log("       A (precision)  : ", aPrecision);
        console.log("       swap fee percentage  : ", swapFeePercentage);
        */
    });

});