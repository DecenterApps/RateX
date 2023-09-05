const hre = require("hardhat");
const {config} = require("../../addresses.config");
const addresses = config[hre.network.config.chainId];

async function deployUniswapQuoter() {
    const quoterUni = await hre.ethers.getContractAt("IQuoterV2", addresses.uniV3.quoterV2);
    return {quoterUni};
}

async function test() {
    const {quoterUni} = await deployUniswapQuoter();

    const params = {
        tokenIn: addresses.tokens.DAI,
        tokenOut: addresses.tokens.USDC,
        amountIn: hre.ethers.parseEther("100"),
        fee: 3000,
        sqrtPriceLimitX96: 0
    };

    let x = await quoterUni.quoteExactInputSingle.staticCall(params);
    console.log("x", x);
}

async function main() {
    await test();
}

main();