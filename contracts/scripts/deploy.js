hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("./utils");

const addresses = config[hre.network.config.chainId];

async function deploySushiDex() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();

    const Lib = await hre.ethers.getContractFactory("SushiSwapV2Library");
    const lib = await Lib.deploy();
    await lib.waitForDeployment();
    const libAddr = await lib.getAddress();

    const SushiSwap = await hre.ethers.getContractFactory("SushiSwapDex", {
        signer: addr1,
        libraries: {
            SushiSwapV2Library: libAddr
        }
    });
    const sushiSwap = await SushiSwap.deploy(addresses.sushiRouter, addresses.sushiFactory);
    await sushiSwap.waitForDeployment();
    const sushiSwapAddress = await sushiSwap.getAddress();

    return {sushiSwapAddress};
}

async function deployRateX() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();
    const { sushiSwapAddress} = await deploySushiDex();

    const RateX = await hre.ethers.getContractFactory("RateX");
    const rateX = await RateX.deploy(sushiSwapAddress);
    await rateX.waitForDeployment();

    return {rateX, addr1, addr2, addr3};
}



async function main() {
    const {rateX } = await deployRateX();
    console.log(await rateX.getAddress());
}

main();