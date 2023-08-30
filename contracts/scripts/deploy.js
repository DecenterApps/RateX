hre = require('hardhat')
const {
    deployRateX,
    deployUniswapHelper,
    deploySushiSwapHelper,
    deployCurveHelper,
    deployCamelotHelper
} = require('./utils/deployment')

const {saveAbiToFile, saveAddresses} = require('./utils/saveABIAndAddresses');
const {config} = require('../addresses.config')
const {resolve, join} = require("path");
const fs = require("fs");
const {deployRateX, deployUniswapHelper, deploySushiSwapHelper, deployBalancerHelper} = require("./utils/deployment");
const {sendWethTokensToUser, sendERCTokensToUser} = require("./utils/contract");
const {config} = require("../addresses.config");
const {
    saveRateXAddressToFile,
    saveRateXAbiToFile,
    saveUniswapHelperAddressToFile,
    saveUniswapHelperAbiToFile,
    saveSushiSwapAddressToFile,
    saveSushiSwapAbiToFile
} = require("./utils/saveABIAndAddresses");

const addresses = config[hre.network.config.chainId]

async function main() {
    const {rateX, addr1} = await deployRateX()
    const {uniswapHelper} = await deployUniswapHelper()
    const { balancerHelper } = await deployBalancerHelper()
    const {sushiHelper} = await deploySushiSwapHelper()
    const {curveHelper} = await deployCurveHelper()
    const {camelotHelper} = await deployCamelotHelper()

    const rateXAddress = await rateX.getAddress();
    console.log('RateX address:' + rateXAddress);

    const uniswapHelperAddress = await uniswapHelper.getAddress();
    console.log("UniswapHelper address:" + uniswapHelperAddress);

    const sushiSwapHelperAddress = await sushiHelper.getAddress();
    console.log("SushiSwapHelper address:" + sushiSwapHelperAddress);

    const curveHelperAddress = await curveHelper.getAddress();
    console.log("CurveHelper address:" + curveHelperAddress);

    const camelotHelperAddress = await camelotHelper.getAddress();
    console.log("CamelotHelper address:" + camelotHelperAddress);

    await saveRateXContractAbi(rateX);
    await saveUniswapHelperContractAbi(uniswapHelper);
    await saveSushiSwapHelperContractAbi(sushiHelper);
    await saveCurveHelperContractAbi(curveHelper);
    await saveCamelotHelperContractAbi(camelotHelper);

    saveAddresses(
        rateXAddress,
        uniswapHelperAddress,
        sushiSwapHelperAddress,
        curveHelperAddress,
        camelotHelperAddress
    );
}

async function saveRateXContractAbi(rateXContract) {
    const RateX = await hre.artifacts.readArtifact('RateX')
    const rateXAbi = RateX.abi
    saveAbiToFile(rateXAbi, 'RateX');
async function saveRateXContract(rateXContract) {
    const address = await rateXContract.getAddress();
    console.log("RateX address: " + address);
    saveRateXAddressToFile(address);

    const RateX = await hre.artifacts.readArtifact("RateX");
    const rateXAbi = RateX.abi;
    saveRateXAbiToFile(rateXAbi);
}

async function saveUniswapHelperContract(uniswapHelperContract) {
    const address = await uniswapHelperContract.getAddress();
    console.log("UniswapHelper address: " + address);
    saveUniswapHelperAddressToFile(address);

    const UniswapHelper = await hre.artifacts.readArtifact("UniswapHelper");
    const uniswapHelperAbi = UniswapHelper.abi;
    saveUniswapHelperAbiToFile(uniswapHelperAbi);
async function saveUniswapHelperContractAbi(uniswapHelperContract) {
    const UniswapHelper = await hre.artifacts.readArtifact('UniswapHelper')
    const uniswapHelperAbi = UniswapHelper.abi
    saveAbiToFile(uniswapHelperAbi, 'UniswapHelper');
}

async function saveSushiSwapHelperContract(sushiHelper) {
    const addressSushiHelper = await sushiHelper.getAddress()
    console.log('SushiSwapHelper address: ' + addressSushiHelper)
    saveSushiSwapAddressToFile(addressSushiHelper)

    const SushiSwapHelper = await hre.artifacts.readArtifact('SushiSwapHelper')
    const sushiSwapAbi = SushiSwapHelper.abi
    saveAbiToFile(sushiSwapAbi, 'SushiSwapHelper');
}

async function saveCurveHelperContractAbi(curveHelper) {
    const CurveHelper = await hre.artifacts.readArtifact('CurveHelper')
    const curveAbi = CurveHelper.abi
    saveAbiToFile(curveAbi, 'CurveHelper');
}

async function saveCamelotHelperContractAbi(camelotHelper) {
    const CamelotHelper = await hre.artifacts.readArtifact('CamelotHelper')
    const camelotAbi = CamelotHelper.abi
    saveAbiToFile(camelotAbi, 'CamelotHelper');
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
