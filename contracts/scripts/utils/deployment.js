hre = require('hardhat')
const { config } = require('../../addresses.config')
const {stringToUint32} = require("./contract");


const addresses = config[hre.network.config.chainId]

async function deploySushiDex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const SushiSwap = await hre.ethers.getContractFactory('SushiSwapDex')
  const sushiSwap = await SushiSwap.deploy(addresses.sushi.router)
  await sushiSwap.waitForDeployment()
  return { sushiSwap, addr1, addr2, addr3 }
}

async function deployCamelotDex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const Camelot = await hre.ethers.getContractFactory('CamelotDex')
  const camelot = await Camelot.deploy(addresses.camelot.router)
  await camelot.waitForDeployment()
  return { camelot, addr1, addr2, addr3 }
}

async function deployUniswapDex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const UniswapV3 = await hre.ethers.getContractFactory('UniswapV3Dex')
  const uniswap = await UniswapV3.deploy(addresses.uniV3.router)
  await uniswap.waitForDeployment()
  return { uniswap, addr1, addr2, addr3 }
}

async function deployBalancerDex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const Balancer = await hre.ethers.getContractFactory('BalancerDex')
  const balancer = await Balancer.deploy(addresses.balancer.vault)
  await balancer.waitForDeployment()
  return { balancer, addr1, addr2, addr3 }
}

async function deployUniswapV2Dex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const UniswapV2 = await hre.ethers.getContractFactory('UniswapV2Dex')
  const uniswapV2 = await UniswapV2.deploy(addresses.uniV2.router)
  await uniswapV2.waitForDeployment()
  return { uniswapV2, addr1, addr2, addr3 }
}

async function deployRateX() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()

  let camelot, camelotAddress
  const { sushiSwap } = await deploySushiDex()
  const { uniswap } = await deployUniswapDex()
  const { balancer } = await deployBalancerDex()
  const { uniswapV2 } = await deployUniswapV2Dex()
  if (hre.network.config.chainId === 42161) {
    camelot = await deployCamelotDex()
    camelotAddress = await camelot.getAddress()
  }

  const sushiSwapAddress = await sushiSwap.getAddress()
  const uniswapAddress = await uniswap.getAddress()
  const balancerAddress = await balancer.getAddress()
  const uniswapV2Address = await uniswapV2.getAddress()

  const initialDexes = [
    {
      dexId: stringToUint32('SUSHI_V2'),
      dexAddress: sushiSwapAddress,
    },
    {
      dexId: stringToUint32('UNI_V3'),
      dexAddress: uniswapAddress,
    },
    {
      dexId: stringToUint32('BALANCER_V2'),
      dexAddress: balancerAddress,
    },
    {
      dexId: stringToUint32('UNI_V2'),
      dexAddress: uniswapV2Address,
    },
  ]

  if (camelotAddress && hre.network.config.chainId === 42161) {
    initialDexes.push({
      dexId: stringToUint32('CAMELOT'),
      dexAddress: camelotAddress,
    },)
  }

  const RateX = await hre.ethers.getContractFactory('RateX')
  const rateX = await RateX.deploy(initialDexes)
  await rateX.waitForDeployment()

  return { rateX, addr1, addr2, addr3 }
}

async function deploySushiSwapHelper() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const SushiHelper = await hre.ethers.getContractFactory('SushiSwapHelper')
  const sushiHelper = await SushiHelper.deploy()
  await sushiHelper.waitForDeployment()
  return { sushiHelper, addr1, addr2, addr3 }
}

async function deployBalancerHelper() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const BalancerHelper = await hre.ethers.getContractFactory('BalancerHelper')
  const balancerHelper = await BalancerHelper.deploy(addresses.balancer.vault)
  await balancerHelper.waitForDeployment()

  return { balancerHelper, addr1, addr2, addr3 }
}

async function deployCamelotHelper() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const CamelotHelper = await hre.ethers.getContractFactory('CamelotHelper')
  const camelotHelper = await CamelotHelper.deploy()
  await camelotHelper.waitForDeployment()
  return { camelotHelper, addr1, addr2, addr3 }
}

async function deployUniswapHelper() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const UniswapHelper = await hre.ethers.getContractFactory('UniswapHelper')
  const uniswapHelper = await UniswapHelper.deploy()
  await uniswapHelper.waitForDeployment()
  return { uniswapHelper, addr1, addr2, addr3 }
}

async function deployUniswapV2Helper() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const UniswapV2Helper = await hre.ethers.getContractFactory('UniswapV2Helper')
  const uniswapV2Helper = await UniswapV2Helper.deploy()
  await uniswapV2Helper.waitForDeployment()
  return { uniswapV2Helper, addr1, addr2, addr3 }
}

module.exports = {
  deployRateX,
  deploySushiDex,
  deploySushiSwapHelper,
  deployUniswapDex,
  deployUniswapV2Dex,
  deployUniswapHelper,
  deployBalancerDex,
  deployBalancerHelper,
  deployCamelotDex,
  deployCamelotHelper,
  deployUniswapV2Helper,
}
