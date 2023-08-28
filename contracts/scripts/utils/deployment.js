hre = require('hardhat')
const { config } = require('../../addresses.config')

const addresses = config[hre.network.config.chainId]

async function deploySushiDex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()

  const Lib = await hre.ethers.getContractFactory('SushiSwapV2Library')
  const lib = await Lib.deploy()
  await lib.waitForDeployment()
  const libAddr = await lib.getAddress()

  const SushiSwap = await hre.ethers.getContractFactory('SushiSwapDex', {
    signer: addr1,
    libraries: {
      SushiSwapV2Library: libAddr,
    },
  })
  const sushiSwap = await SushiSwap.deploy(addresses.sushiRouter, addresses.sushiFactory)
  await sushiSwap.waitForDeployment()

  return { sushiSwap, addr1, addr2, addr3 }
}

async function deployUniswapDex() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const UniswapV3 = await hre.ethers.getContractFactory('UniswapV3Dex')
  const uniswap = await UniswapV3.deploy(addresses.uniQuoter, addresses.uniRouter)
  await uniswap.waitForDeployment()
  return { uniswap, addr1, addr2, addr3 }
}

async function deployCurveDex(poolId) {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const Curve = await hre.ethers.getContractFactory('CurveDex')
  const curve = await Curve.deploy(poolId)
  await curve.waitForDeployment()
  return { curve, addr1, addr2, addr3 }
}

async function deployBalancerDex() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();
    const Balancer = await hre.ethers.getContractFactory("BalancerDex");
    const balancer = await Balancer.deploy(addresses.balancerVault);
    await balancer.waitForDeployment();
    return {balancer, addr1, addr2, addr3};
}

async function deployRateX() {
  const [addr1, addr2, addr3] = await hre.ethers.getSigners()
  const { sushiSwap } = await deploySushiDex()
  const { uniswap } = await deployUniswapDex()
  const sushiSwapAddress = await sushiSwap.getAddress()
  const uniswapAddress = await uniswap.getAddress()

  const RateX = await hre.ethers.getContractFactory('RateX')
  const rateX = await RateX.deploy(sushiSwapAddress, uniswapAddress)
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

async function deployBalancerHelper() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();
    const Balancer = await hre.ethers.getContractFactory("BalancerDex");
    const balancer = await Balancer.deploy(addresses.balancerVault);
    await balancer.waitForDeployment();
    return {balancer, addr1, addr2, addr3};
}

async function deployUniswapHelper() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();
    const UniswapHelper = await hre.ethers.getContractFactory("UniswapHelper");
    const uniswapHelper = await UniswapHelper.deploy();
    await uniswapHelper.waitForDeployment();
    return {uniswapHelper, addr1, addr2, addr3};
}

module.exports = {
    deployRateX,
    deploySushiDex,
    deployUniswapDex,
    deployCurveDex,
    deployUniswapHelper,
    deploySushiSwapHelper,
    deployBalancerDex,
    deployBalancerHelper
}