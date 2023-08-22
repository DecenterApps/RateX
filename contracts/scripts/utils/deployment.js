hre = require("hardhat");
const {config} = require("../../addresses.config");

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

    return {sushiSwap, addr1, addr2, addr3};
}

async function deployUniswapDex() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();
    const UniswapV3 = await hre.ethers.getContractFactory("UniswapV3Dex");
    const uniswap = await UniswapV3.deploy(addresses.uniQuoter, addresses.uniRouter);
    await uniswap.waitForDeployment();
    return {uniswap, addr1, addr2, addr3};
}

async function deployCurveDex(dexId) {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();
    const Curve = await hre.ethers.getContractFactory("CurveDex");
    const curve = await Curve.deploy(dexId);
    await curve.waitForDeployment();
    return {curve, addr1, addr2, addr3};
}

async function deployRateX() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();
    const { sushiSwap} = await deploySushiDex();
    const { uniswap } = await deployUniswapDex();
    const sushiSwapAddress = await sushiSwap.getAddress();
    const uniswapAddress = await uniswap.getAddress();

    const RateX = await hre.ethers.getContractFactory("RateX");
    const rateX = await RateX.deploy(sushiSwapAddress, uniswapAddress);
    await rateX.waitForDeployment();

    return {rateX, addr1, addr2, addr3};
}

module.exports = {
    deployRateX,
    deploySushiDex,
    deployUniswapDex,
    deployCurveDex
}