hre = require("hardhat");
const {config} = require("../../addresses.config");
const {resolve, join} = require("path");
const fs = require("fs");


const addresses = config[hre.network.config.chainId];

async function deploySushiDex() {
    const [addr1] = await hre.ethers.getSigners();

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

    return {sushiSwap, addr1};
}

async function deployUniswapDex() {
    const [addr1] = await hre.ethers.getSigners();
    const UniswapV3 = await hre.ethers.getContractFactory("UniswapV3Dex");
    const uniswap = await UniswapV3.deploy(addresses.uniQuoter, addresses.uniRouter);
    await uniswap.waitForDeployment();
    return {uniswap, addr1};
}

async function deployRateX() {
    const [addr1] = await hre.ethers.getSigners();
    const { sushiSwap} = await deploySushiDex();
    const { uniswap } = await deployUniswapDex();
    const sushiSwapAddress = await sushiSwap.getAddress();
    const uniswapAddress = await uniswap.getAddress();

    const RateX = await hre.ethers.getContractFactory("RateX");
    const rateX = await RateX.deploy(sushiSwapAddress, uniswapAddress);
    await rateX.waitForDeployment();

    const rateXAddress = await rateX.getAddress();

    saveAddressesToFile(sushiSwapAddress, uniswapAddress, rateXAddress);

    return {rateX, addr1};
}

function saveAddressesToFile(sushiSwapAddress, uniswapAddress, rateXAddress) {
    const content = `
rateXAddress: ${rateXAddress}
sushiSwapAddress: ${sushiSwapAddress}
uniSwapAddress: ${uniswapAddress}
    `;
    const dirPath = resolve(__dirname, './');
    const filePath = join(dirPath, 'tenderlyAddresses.txt');
    fs.writeFileSync(filePath, content);
}


module.exports = {
    deployRateX,
    deploySushiDex,
    deployUniswapDex
}