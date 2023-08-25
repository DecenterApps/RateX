

const hre = require("hardhat");
const {config} = require("../../addresses.config");
const addresses = config[hre.network.config.chainId];

async function deployUniswapQuoter() {
    const quoterUni = await hre.ethers.getContractAt("IQuoterV2", addresses.uniQuoterV2);
    return {quoterUni};
}

async function test() {
    const {quoterUni} = await deployUniswapQuoter();

    // const params = {
    //     tokenIn: addresses.wethToken,
    //     tokenOut: addresses.wbtcToken,
    //     amountIn: hre.ethers.parseEther("1"),
    //     fee: 3000,
    //     sqrtPriceLimitX96: 0
    // };

    const params = {
        tokenIn: addresses.daiToken,
        tokenOut: addresses.wethToken,
        amountIn: hre.ethers.parseEther("100"),
        fee: 3000,
        sqrtPriceLimitX96: 0
    };
    //60556681737100835n,

    let x = await quoterUni.quoteExactInputSingle.staticCall(params);
    console.log("x", x);
}

async function main() {
    await test();
}

main();