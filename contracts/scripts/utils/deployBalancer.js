hre = require('hardhat')
const { config } = require('../../addresses.config')

const addresses = config[hre.network.config.chainId]

async function deployBalancerDex() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();
    const Balancer = await hre.ethers.getContractFactory("BalancerDex");
    const balancer = await Balancer.deploy(addresses.balancerVault);
    await balancer.waitForDeployment();

    const balancerAddress = await balancer.getAddress();
    console.log("Balancer address: ", balancerAddress);

    return {balancer, addr1, addr2, addr3};
}


deployBalancerDex();