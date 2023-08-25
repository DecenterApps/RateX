hre = require("hardhat");
const {deployRateX, deployUniswapHelper, deploySushiSwapHelper} = require("./utils/deploymentTenderly");
const {
    saveRateXAddressToFile,
    saveRateXAbiToFile,
    saveUniswapHelperAddressToFile,
    saveUniswapHelperAbiToFile,
    saveSushiSwapAddressToFile,
    saveSushiSwapAbiToFile
} = require("./utils/saveABIAndAddresses");


async function main() {
    const {rateX, addr1} = await deployRateX();
    const {uniswapHelper} = await deployUniswapHelper();
    const { sushiHelper } = await deploySushiSwapHelper()

    await saveRateXContract(rateX);
    await saveUniswapHelperContract(uniswapHelper);
    await saveSushiSwapHelperContract(sushiHelper);
}

async function saveRateXContract(rateXContract) {
    const address = await rateXContract.getAddress();
    console.log("RateX address:" + address);
    saveRateXAddressToFile(address);

    const RateX = await hre.artifacts.readArtifact("RateX");
    const rateXAbi = RateX.abi;
    saveRateXAbiToFile(rateXAbi);
}

async function saveUniswapHelperContract(uniswapHelperContract) {
    const address = await uniswapHelperContract.getAddress();
    console.log("UniswapHelper address:" + address);
    saveUniswapHelperAddressToFile(address);

    const UniswapHelper = await hre.artifacts.readArtifact("UniswapHelper");
    const uniswapHelperAbi = UniswapHelper.abi;
    saveUniswapHelperAbiToFile(uniswapHelperAbi);
}

async function saveSushiSwapHelperContract(sushiHelper) {
    const addressSushiHelper = await sushiHelper.getAddress()
    console.log('SushiSwapHelper address:' + addressSushiHelper)
    saveSushiSwapAddressToFile(addressSushiHelper)

    const SushiSwapHelper = await hre.artifacts.readArtifact('SushiSwapHelper')
    const sushiSwapAbi = SushiSwapHelper.abi
    saveSushiSwapAbiToFile(sushiSwapAbi)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
