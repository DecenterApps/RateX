hre = require('hardhat')
const { resolve, join } = require('path')
const fs = require('fs')
const { deployRateX, deployUniswapHelper, deploySushiSwapHelper, deployCurveHelper } = require('./utils/deployment')
const { sendWethTokensToUser, sendERCTokensToUser } = require('./utils/contract')
const { config } = require('../addresses.config')
const {
  saveRateXAddressToFile,
  saveRateXAbiToFile,
  saveUniswapHelperAddressToFile,
  saveUniswapHelperAbiToFile,
  saveSushiSwapAddressToFile,
  saveSushiSwapAbiToFile,
  saveCurveAddressToFile,
  saveCurveAbiToFile,
} = require('./utils/saveABIAndAddresses')

const addresses = config[hre.network.config.chainId]

async function main() {
  const { rateX, addr1 } = await deployRateX()
  const { uniswapHelper } = await deployUniswapHelper()
  const { sushiHelper } = await deploySushiSwapHelper()
  const { curveHelper } = await deployCurveHelper()

  await sendWethTokensToUser(addr1, hre.ethers.parseEther('1000'))
  await saveRateXContract(rateX)
  await saveUniswapHelperContract(uniswapHelper)
  await saveSushiSwapHelperContract(sushiHelper)
  await saveCurveHelperContract(curveHelper)
}

async function saveRateXContract(rateXContract) {
  const address = await rateXContract.getAddress()
  console.log('RateX address:' + address)
  saveRateXAddressToFile(address)

  const RateX = await hre.artifacts.readArtifact('RateX')
  const rateXAbi = RateX.abi
  saveRateXAbiToFile(rateXAbi)
}

async function saveUniswapHelperContract(uniswapHelperContract) {
  const address = await uniswapHelperContract.getAddress()
  console.log('UniswapHelper address:' + address)
  saveUniswapHelperAddressToFile(address)

  const UniswapHelper = await hre.artifacts.readArtifact('UniswapHelper')
  const uniswapHelperAbi = UniswapHelper.abi
  saveUniswapHelperAbiToFile(uniswapHelperAbi)
}

async function saveSushiSwapHelperContract(sushiHelper) {
  const addressSushiHelper = await sushiHelper.getAddress()
  console.log('SushiSwapHelper address:' + addressSushiHelper)
  saveSushiSwapAddressToFile(addressSushiHelper)

  const SushiSwapHelper = await hre.artifacts.readArtifact('SushiSwapHelper')
  const sushiSwapAbi = SushiSwapHelper.abi
  saveSushiSwapAbiToFile(sushiSwapAbi)
}

async function saveCurveHelperContract(curveHelper) {
  const addressCurveHelper = await curveHelper.getAddress()
  console.log('CurveHelper address:' + addressCurveHelper)
  saveCurveAddressToFile(addressCurveHelper)

  const CurveHelper = await hre.artifacts.readArtifact('CurveHelper')
  const curveAbi = CurveHelper.abi
  saveCurveAbiToFile(curveAbi)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
