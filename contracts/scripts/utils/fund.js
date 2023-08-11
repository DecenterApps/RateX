hre = require("hardhat");
const {sendWethTokensToUser, sendERCTokensToUser} = require("./contract");

async function main() {
    const [addr1] = await hre.ethers.getSigners()
    await sendWethTokensToUser(addr1, hre.ethers.parseEther("100"));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});