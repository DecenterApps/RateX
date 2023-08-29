hre = require('hardhat')
const { config } = require('../../addresses.config')

const addresses = config[hre.network.config.chainId]

async function deploySushiDex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const SushiSwap = await hre.ethers.getContractFactory('SushiSwapDex')
  const sushiSwap = await SushiSwap.deploy(addresses.sushi.router)
  await sushiSwap.waitForDeployment()
  return { sushiSwap, addr1, addr2, addr3 }
}

async function deployUniswapDex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const UniswapV3 = await hre.ethers.getContractFactory('UniswapV3Dex')
  const uniswap = await UniswapV3.deploy(addresses.uniV3.router)
  await uniswap.waitForDeployment()
  return { uniswap, addr1, addr2, addr3 }
}

async function deployCurveDex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners();
  const Curve = await hre.ethers.getContractFactory("CurveDex");
  const curve = await Curve.deploy(addresses.curve.poolRegistry);
  await curve.waitForDeployment();
  return { curve, addr1, addr2, addr3};
}

async function deployRateX() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()

  const { sushiSwap } = await deploySushiDex()
  const { uniswap } = await deployUniswapDex()
  const { curve } = await deployCurveDex()

  const sushiSwapAddress = await sushiSwap.getAddress()
  const uniswapAddress = await uniswap.getAddress()
  const curveAddress = await curve.getAddress()

  const initialDexes = [
    {
      dexId: "SUSHI_V2",
      dexAddress: sushiSwapAddress
    },
    {
      dexId: "UNI_V3",
      dexAddress: uniswapAddress
    },
    {
      dexId: "CURVE",
      dexAddress: curveAddress
    }
  ];

  const RateX = await hre.ethers.getContractFactory('RateX')
  const rateX = await RateX.deploy(initialDexes)
  await rateX.waitForDeployment()

  return { rateX, addr1, addr2, addr3 }
}

async function deploySushiSwapHelper() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const Sushi = await hre.ethers.getContractFactory('SushiSwapHelper')
  const sushiHelper = await Sushi.deploy()
  await sushiHelper.waitForDeployment()
  return { sushiHelper, addr1, addr2, addr3 }
}

async function deployUniswapHelper() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const UniswapHelper = await hre.ethers.getContractFactory('UniswapHelper')
  const uniswapHelper = await UniswapHelper.deploy()
  await uniswapHelper.waitForDeployment()
  return { uniswapHelper, addr1, addr2, addr3 }
}

async function deployCurveHelper() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const CurveHelper = await hre.ethers.getContractFactory('CurveHelper')
  const curveHelper = await CurveHelper.deploy()
  await curveHelper.waitForDeployment()
  return { curveHelper, addr1, addr2, addr3 }
}

module.exports = {
  deployRateX,
  deploySushiDex,
  deployUniswapDex,
  deployCurveDex,
  deployUniswapHelper,
  deploySushiSwapHelper,
  deployCurveHelper,
}
