hre = require('hardhat')
const {
    deployRateX,
    deployUniswapHelper,
    deploySushiSwapHelper,
    deployCurveHelper
} = require('./utils/deployment')

const {saveAbiToFile, saveAddresses} = require('./utils/saveABIAndAddresses');
const {config} = require('../addresses.config')
const {resolve, join} = require("path");
const fs = require("fs");

async function main() {
    const {rateX, addr1} = await deployRateX()
    const {uniswapHelper} = await deployUniswapHelper()
    const {sushiHelper} = await deploySushiSwapHelper()
    const {curveHelper} = await deployCurveHelper()

    const rateXAddress = await rateX.getAddress();
    console.log('RateX address:' + rateXAddress);

    const uniswapHelperAddress = await uniswapHelper.getAddress();
    console.log("UniswapHelper address:" + uniswapHelperAddress);

    const sushiSwapHelperAddress = await sushiHelper.getAddress();
    console.log("SushiSwapHelper address:" + sushiSwapHelperAddress);

    const curveHelperAddress = await curveHelper.getAddress();
    console.log("CurveHelper address:" + curveHelperAddress);

    await saveRateXContractAbi(rateX);
    await saveUniswapHelperContractAbi(uniswapHelper);
    await saveSushiSwapHelperContractAbi(sushiHelper);
    await saveCurveHelperContractAbi(curveHelper);

    saveAddresses(
        rateXAddress,
        uniswapHelperAddress,
        sushiSwapHelperAddress,
        curveHelperAddress
    );
}

async function saveRateXContractAbi(rateXContract) {
    const RateX = await hre.artifacts.readArtifact('RateX')
    const rateXAbi = RateX.abi
    saveAbiToFile(rateXAbi, 'RateX');
}

async function saveUniswapHelperContractAbi(uniswapHelperContract) {
    const UniswapHelper = await hre.artifacts.readArtifact('UniswapHelper')
    const uniswapHelperAbi = UniswapHelper.abi
    saveAbiToFile(uniswapHelperAbi, 'UniswapHelper');
}

async function saveSushiSwapHelperContractAbi(sushiHelper) {
    const SushiSwapHelper = await hre.artifacts.readArtifact('SushiSwapHelper')
    const sushiSwapAbi = SushiSwapHelper.abi
    saveAbiToFile(sushiSwapAbi, 'SushiSwapHelper');
}

async function saveCurveHelperContractAbi(curveHelper) {
    const CurveHelper = await hre.artifacts.readArtifact('CurveHelper')
    const curveAbi = CurveHelper.abi
    saveAbiToFile(curveAbi, 'CurveHelper');
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
