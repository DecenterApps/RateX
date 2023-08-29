hre = require('hardhat')
const { config } = require('../../addresses.config')
const {sendWethTokensToUser, sendERCTokensToUser} = require("./contract");

const addresses = config[hre.network.config.chainId]

async function main() {
  const [addr1] = await hre.ethers.getSigners();
  await sendWethTokensToUser(addr1, hre.ethers.parseEther('1000'));

  // add more tokens here and check if impersonate address has enough tokens
  await sendERCTokensToUser(addresses.impersonate_dai, addresses.daiToken, addr1, hre.ethers.parseEther('10000'));
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
