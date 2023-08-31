hre = require("hardhat");
const {sendWethTokensToUser, sendERCTokensToUser} = require("./contract");

addRadiant = async function (addr1) {
    const radiantAddress = "0x3082cc23568ea640225c2467653db90e9250aaa0";
    const RADIANT = await hre.ethers.getContractAt("IERC20", radiantAddress);
    const balanceBefore = await RADIANT.balanceOf(addr1);
    await sendERCTokensToUser(
        "0xf977814e90da44bfa03b6295a0616a897441acec",
        radiantAddress,
        addr1,
        hre.ethers.parseEther("10000")
    );

    const balanceAfter = await RADIANT.balanceOf(addr1);

    // console.log(balanceBefore.toString());
    // console.log(balanceAfter.toString());
}

addDai = async function (addr1) {
    const daiAddress = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";
    const DAI = await hre.ethers.getContractAt("IERC20", daiAddress);
    const balanceBefore = await DAI.balanceOf(addr1);
    await sendERCTokensToUser(
        "0x5ec6abff9bb4c673f63d077a962a29945f744857",
        daiAddress,
        addr1,
        hre.ethers.parseEther("10000")
    );

    const balanceAfter = await DAI.balanceOf(addr1);

    // console.log(balanceBefore.toString());
    // console.log(balanceAfter.toString());
}

async function main() {
    const [addr1] = await hre.ethers.getSigners()
    await sendWethTokensToUser(addr1, hre.ethers.parseEther("100"));

    addRadiant(addr1);
    addDai(addr1);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});