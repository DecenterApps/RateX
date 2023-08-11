hre = require("hardhat");
const {config} = require("../../addresses.config");

const addresses = config[hre.network.config.chainId];

async function main() {
    const [addr1] = await hre.ethers.getSigners()
    const WETH = await hre.ethers.getContractAt("IERC20", addresses.wethToken);
    const WBTC = await hre.ethers.getContractAt("IERC20", addresses.wbtcToken);
    const DAI = await  hre.ethers.getContractAt("IERC20", addresses.daiToken);
    const USDC = await hre.ethers.getContractAt("IERC20", addresses.usdcToken);
    const LINK = await hre.ethers.getContractAt("IERC20", addresses.linkToken);

    const WETHBalance = await WETH.balanceOf(addr1);
    const WBTCBalance = await WBTC.balanceOf(addr1);
    const DAIBalance = await DAI.balanceOf(addr1);
    const USDCBalance = await USDC.balanceOf(addr1);
    const LINKBalance = await LINK.balanceOf(addr1);

    console.log("WETH Balance: ", WETHBalance.toString());
    console.log("WBTC Balance: ", WBTCBalance.toString());
    console.log("DAI Balance: ", DAIBalance.toString());
    console.log("USDC Balance: ", USDCBalance.toString());
    console.log("LINK Balance: ", LINKBalance.toString());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
