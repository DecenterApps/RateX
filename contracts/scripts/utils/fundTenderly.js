hre = require('hardhat')
const { config } = require('../../addresses.config')
const {sendWethTokensToUser} = require("./contract");

const addresses = config[hre.network.config.chainId]

async function main() {
    const [addr1] = await hre.ethers.getSigners();

    // we are only sending weth tokens in tenderly because impersonate address works only for hardhat network
    await sendWethTokensToUser(addr1, hre.ethers.parseEther('1000'));
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
