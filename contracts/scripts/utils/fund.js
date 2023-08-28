hre = require('hardhat')
const { sendWethTokensToUser, sendERCTokensToUser } = require('./contract')

async function main() {
  const [addr1] = await hre.ethers.getSigners()
  const daiAddress = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  const impersonatedAddress = '0xbdb910984f263ff8cb96ee765067a8f95e0ed587'
  await sendERCTokensToUser(impersonatedAddress, daiAddress, addr1, hre.ethers.parseEther('10000'))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
