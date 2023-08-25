hre = require("hardhat");
const {resolve, join} = require("path");
const fs = require("fs");
const {deployRateX, deployUniswapHelper, deploySushiSwapHelper} = require("./utils/deployment");
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
    const {rateX, addr1} = await deployRateX();
    const {uniswapHelper} = await deployUniswapHelper();
    const { sushiHelper } = await deploySushiSwapHelper()

    await sendWethTokensToUser(addr1, hre.ethers.parseEther("1000"));
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
  console.error(error)
  process.exitCode = 1
})
