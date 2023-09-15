const hre = require("hardhat");
const {config} = require("../../addresses.config");

async function sendWethTokensToUser(toAddress, amount) {
    const iWeth = await hre.ethers.getContractAt(
        "IWeth", config[hre.network.config.chainId].tokens.WETH, toAddress);

    const txResponse = await iWeth.deposit({value: amount,});
    await txResponse.wait();
}

async function approveToContract(owner, contractAddress, tokenAddress, amount) {
    const erc20Token = await hre.ethers.getContractAt("IERC20", tokenAddress, owner);
    const tx = await erc20Token.approve(contractAddress, amount);
    await tx.wait();
}

async function sendERCTokensToUser(impersonatedAddress, tokenAddress, toAddress, amount) {
    const signer = await hre.ethers.getImpersonatedSigner(impersonatedAddress);
    const ercToken = await hre.ethers.getContractAt("IERC20", tokenAddress, signer);
    const txTransfer = await ercToken.connect(signer).transfer(toAddress, amount);
    await txTransfer.wait();
}

module.exports = {
    sendWethTokensToUser,
    approveToContract,
    sendERCTokensToUser
}
