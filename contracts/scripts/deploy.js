hre = require('hardhat')
const {
    deployRateX,
    deployUniswapHelper,
    deploySushiSwapHelper,
    deployCamelotHelper,
    deployBalancerHelper,
    deployUniswapV2Helper
} = require('./utils/deployment')

const {saveAbiToFile, saveAddresses} = require('./utils/saveABIAndAddresses');

async function main() {
    console.log('Deploying contracts...')
    const {rateX} = await deployRateX()
    const {uniswapHelper} = await deployUniswapHelper()
    const {balancerHelper} = await deployBalancerHelper()
    const {sushiHelper} = await deploySushiSwapHelper()
    const {camelotHelper} = await deployCamelotHelper()
    const {uniswapV2Helper} = await deployUniswapV2Helper()

    const rateXAddress = await rateX.getAddress();
    console.log('RateX address: ' + rateXAddress);

    const uniswapHelperAddress = await uniswapHelper.getAddress();
    console.log("UniswapHelper address: " + uniswapHelperAddress);

    const sushiSwapHelperAddress = await sushiHelper.getAddress();
    console.log("SushiSwapHelper address: " + sushiSwapHelperAddress);

    const camelotHelperAddress = await camelotHelper.getAddress();
    console.log("CamelotHelper address: " + camelotHelperAddress);

    const balancerHelperAddress = await balancerHelper.getAddress();
    console.log("BalancerHelper address: " + balancerHelperAddress);

    const uniswapV2HelperAddress = await uniswapV2Helper.getAddress();
    console.log("UniswapV2Helper address: " + uniswapV2HelperAddress);

    await saveAbisToFile();

    saveAddresses(
        rateXAddress,
        uniswapHelperAddress,
        sushiSwapHelperAddress,
        camelotHelperAddress,
        balancerHelperAddress,
        uniswapV2HelperAddress
    );
}

async function saveAbisToFile() {
    await saveAbiToFile((await hre.artifacts.readArtifact('RateX')).abi, 'RateX');
    await saveAbiToFile((await hre.artifacts.readArtifact('UniswapHelper')).abi, 'UniswapHelper');
    await saveAbiToFile((await hre.artifacts.readArtifact('SushiSwapHelper')).abi, 'SushiSwapHelper');
    await saveAbiToFile((await hre.artifacts.readArtifact('CamelotHelper')).abi, 'CamelotHelper');
    await saveAbiToFile((await hre.artifacts.readArtifact('BalancerHelper')).abi, 'BalancerHelper');
    await saveAbiToFile((await hre.artifacts.readArtifact('UniswapV2Helper')).abi, 'UniswapV2Helper');
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
