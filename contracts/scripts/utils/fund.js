hre = require("hardhat");
const {sendWethTokensToUser, sendERCTokensToUser} = require("./contract");

async function main() {
    const [addr1] = await hre.ethers.getSigners()
    await sendWethTokensToUser(addr1, hre.ethers.parseEther("100"));

    const radiantAddress = "0x3082cc23568ea640225c2467653db90e9250aaa0";
    const RADIANT = await hre.ethers.getContractAt("IERC20", radiantAddress);

    const balanceBefore = await RADIANT.balanceOf(addr1);
    await sendERCTokensToUser(
        "0xf977814e90da44bfa03b6295a0616a897441acec",
        radiantAddress,
        addr1,
        hre.ethers.parseEther("10000"));

    const balanceAfter = await RADIANT.balanceOf(addr1);

    // console.log(balanceBefore.toString());
    // console.log(balanceAfter.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});