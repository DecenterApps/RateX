hre = require("hardhat");
const { config } = require("../addresses.config");
const { sendWethTokensToUser, approveToContract } = require("../scripts/utils/contract");

// struct ExactInputSingleParams {
//     address tokenIn;
//     address tokenOut;
//     uint24 fee;
//     address recipient;
//     uint256 deadline;
//     uint256 amountIn;
//     uint256 amountOutMinimum;
//     uint160 sqrtPriceLimitX96;
// }

// /// @notice Swaps `amountIn` of one token for as much as possible of another token
// /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata
// /// @return amountOut The amount of the received token
// function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
async function main() {
    const [addr1, addr2] = await hre.ethers.getSigners();
    const addresses = config[hre.network.config.chainId];
    //const pool = await hre.ethers.getContractAt("ISwapRouterMine", addresses.uniRouter);
    //await sendWethTokensToUser(addr1, hre.ethers.parseEther("100"))
    
    await approveToContract(
        addr1,
        "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
        addresses.wbtcToken,
        hre.ethers.parseEther("1000")
    );

    // const SwapRouter = await hre.artifacts.readArtifact("ISwapRouterMine");
    // const abi = SwapRouter.abi;
    // console.log(abi);

    // const params = {
    //     tokenIn:,
    //     tokenOut: addresses.wbtcToken,
    //     fee: 500,
    //     recipient: addr1,
    //     deadline: 1792968092,
    //     amountIn: hre.ethers.parseEther("10"),
    //     amountOutMinimum: 1,
    //     sqrtPriceLimitX96: 0
    // }
    // const tx = await pool.exactInputSingle(params);
}

// {
//     "tokenIn": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
//     "tokenOut": "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
//     "fee": 500,
//     "recipient": "0x00d4A50f3f6ff23072a7e60E3EA6c8F2036F978A",
//     "deadline": 1792968092,
//     "amountIn": "10000000000000000000",
//     "amountOutMinimum": 1,
//     "sqrtPriceLimitX96": 0
// }

main();