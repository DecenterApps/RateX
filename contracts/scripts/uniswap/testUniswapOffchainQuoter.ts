import {config} from "../../addresses.config";
import {PoolData, TickData, TradeInfo} from "./types";
import {convertRowPoolData} from "./utils";
import {UniswapOffchainQuoter} from "./uniswapOffchainQuoter";

const hre = require("hardhat");
const addresses = config[hre.network.config.chainId];

async function deployUniswapQuoter() {
    const quoterUni = await hre.ethers.getContractAt("IQuoterV2", addresses.uniQuoterV2);
    return {quoterUni};
}

async function deployUniswapHelper() {
    const UniswapHelper = await hre.ethers.getContractFactory("UniswapHelper");
    const uniswapHelper = await UniswapHelper.deploy();
    await uniswapHelper.waitForDeployment();
    return {uniswapHelper};
}

async function test() {
    const {uniswapHelper} = await deployUniswapHelper();
    const {quoterUni} = await deployUniswapQuoter();

    const poolDataMap: Map<string,PoolData> = await fetchPoolData(uniswapHelper);
    const trades: TradeInfo[] = getTestTrades();
    const uniswapOffchainQuoter = new UniswapOffchainQuoter();

    for (let tradeInfo of trades) {
        let params = {
            tokenIn: tradeInfo.tokenIn,
            tokenOut: tradeInfo.tokenOut,
            amountIn: tradeInfo.amountIn,
            fee: tradeInfo.fee,
            sqrtPriceLimitX96: 0
        };
        let x = (await quoterUni.quoteExactInputSingle.staticCall(params));
        let y = uniswapOffchainQuoter.quote(
            poolDataMap.get(tradeInfo.pool),
            tradeInfo.tokenIn,
            tradeInfo.tokenOut,
            tradeInfo.amountIn
        );
        console.log("-------");
        console.log("Uniswap quote: ", x[0], x[2]);
        console.log("Offchain quote: ", y[0], y[1]);
    }
}

function getTestTrades(): TradeInfo[] {
    let trades: TradeInfo[] = [];

    trades.push(new TradeInfo(
        addresses.univ3_wbtc_eth_pool_0_3,
        addresses.wethToken,
        addresses.wbtcToken,
        hre.ethers.parseEther("100"),
        3000
    ));
    trades.push(new TradeInfo(
        addresses.gmx_usdc_pool_0_1,
        addresses.gmxToken,
        addresses.usdcToken,
        hre.ethers.parseEther("200"),
        10000
    ));
    trades.push(new TradeInfo(
        addresses.uni_weth_pool,
        addresses.wethToken,
        addresses.uniToken,
        hre.ethers.parseEther("1"),
        3000
    ));
    trades.push(new TradeInfo(
        addresses.weth_link_pool,
        addresses.linkToken,
        addresses.wethToken,
        hre.ethers.parseEther("3000"),
        3000
    ));
    trades.push(new TradeInfo(
        addresses.dai_usdce_pool_0_0_1,
        addresses.usdceToken,
        addresses.daiToken,
        BigInt("10000000000"), // 10 000 usdc
        100
    ));

    /// ZERO FOR ONE

    trades.push(new TradeInfo(
        addresses.univ3_wbtc_eth_pool_0_3,
        addresses.wbtcToken,
        addresses.wethToken,
        BigInt("1000000000"), // 10 WBTC
        3000
    ));
    trades.push(new TradeInfo(
        addresses.gmx_usdc_pool_0_1,
        addresses.usdcToken,
        addresses.gmxToken,
        BigInt("1000000000"), // 1000 USDC
        10000
    ));
    trades.push(new TradeInfo(
        addresses.uni_weth_pool,
        addresses.uniToken,
        addresses.wethToken,
        hre.ethers.parseEther("1000"),
        3000
    ));
    trades.push(new TradeInfo(
        addresses.weth_link_pool,
        addresses.wethToken,
        addresses.linkToken,
        hre.ethers.parseEther("10"),
        3000
    ));
    trades.push(new TradeInfo(
        addresses.dai_usdce_pool_0_0_1,
        addresses.daiToken,
        addresses.usdceToken,
        hre.ethers.parseEther("1000"),
        100
    ));


    return trades;
}


async function fetchPoolData(uniswapHelperContract: any): Promise<Map<string, PoolData>> {
    const pools: string[] = [
        addresses.univ3_wbtc_eth_pool_0_3,
        addresses.gmx_usdc_pool_0_1,
        addresses.uni_weth_pool,
        addresses.weth_link_pool,
        addresses.dai_usdce_pool_0_0_1
    ];
    const numOfTicks = 15;

    const raw = await uniswapHelperContract.fetchData(pools, numOfTicks);
    const poolsData: PoolData[] = raw.map((poolDataRaw: any) => convertRowPoolData(poolDataRaw));

    // const poolData = poolsData[0];
    // const zeroForOneTicks = poolData.zeroForOneTicks;
    // const oneForZeroTicks = poolData.oneForZeroTicks;
    // zeroForOneTicks.forEach((tick: TickData) => {
    //    console.log("zeroForOneTicks: ", tick.tick, tick.initialized, tick.liquidityNet);
    // });
    // oneForZeroTicks.forEach((tick: TickData) => {
    //     console.log("oneForZeroTicks: ", tick.tick, tick.initialized, tick.liquidityNet);
    // });

    let hashMap = new Map<string, PoolData>();
    poolsData.forEach((poolData: PoolData) => hashMap.set(poolData.info.pool, poolData));

    return hashMap;
}


async function main() {
    await test();
}


main();
