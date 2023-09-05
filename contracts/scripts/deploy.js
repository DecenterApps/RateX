hre = require('hardhat')
const {
    deployRateX,
    deployUniswapHelper,
    deploySushiSwapHelper,
    deployCurveHelper,
    deployCamelotHelper,
    deployBalancerHelper
} = require('./utils/deployment')

const {saveAbiToFile, saveAddresses} = require('./utils/saveABIAndAddresses');
const {config} = require('../addresses.config')
const {resolve, join} = require("path");
const fs = require("fs");
const {sendWethTokensToUser, sendERCTokensToUser} = require("./utils/contract");


const addresses = config[hre.network.config.chainId]

async function main() {
    console.log('Deploying contracts...')
    const {rateX, addr1} = await deployRateX()
    const {uniswapHelper} = await deployUniswapHelper()
    const {balancerHelper} = await deployBalancerHelper()
    const {sushiHelper} = await deploySushiSwapHelper()
    const {curveHelper} = await deployCurveHelper()
    const {camelotHelper} = await deployCamelotHelper()

    const rateXAddress = await rateX.getAddress();
    console.log('RateX address: ' + rateXAddress);

    const uniswapHelperAddress = await uniswapHelper.getAddress();
    console.log("UniswapHelper address: " + uniswapHelperAddress);

    const sushiSwapHelperAddress = await sushiHelper.getAddress();
    console.log("SushiSwapHelper address: " + sushiSwapHelperAddress);

    const curveHelperAddress = await curveHelper.getAddress();
    console.log("CurveHelper address: " + curveHelperAddress);

    const camelotHelperAddress = await camelotHelper.getAddress();
    console.log("CamelotHelper address: " + camelotHelperAddress);

    const balancerHelperAddress = await balancerHelper.getAddress();
    console.log("BalancerHelper address: " + balancerHelperAddress);

    await saveRateXContractAbi(rateX);
    await saveUniswapHelperContractAbi(uniswapHelper);
    await saveSushiSwapHelperContractAbi(sushiHelper);
    await saveCurveHelperContractAbi(curveHelper);
    await saveCamelotHelperContractAbi(camelotHelper);
    await saveBalancerHelperContractAbi(balancerHelper);

    saveAddresses(
        rateXAddress,
        uniswapHelperAddress,
        sushiSwapHelperAddress,
        curveHelperAddress,
        camelotHelperAddress,
        balancerHelperAddress
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

async function saveCamelotHelperContractAbi(camelotHelper) {
    const CamelotHelper = await hre.artifacts.readArtifact('CamelotHelper')
    const camelotAbi = CamelotHelper.abi
    saveAbiToFile(camelotAbi, 'CamelotHelper');
}

async function saveBalancerHelperContractAbi(balancerHelper) {
    const BalancerHelper = await hre.artifacts.readArtifact('BalancerHelper')
    const balancerAbi = BalancerHelper.abi
    saveAbiToFile(balancerAbi, 'BalancerHelper');
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
