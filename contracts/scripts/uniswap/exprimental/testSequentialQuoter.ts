import {config} from "../../../addresses.config";
import {PoolData, PoolState, StepComputations, SwapState, TickData} from "./types";
import {convertInitialPoolDataToPoolState, convertRowPoolData} from "./utils";
import {FeeAmount, LiquidityMath, SwapMath, TickMath} from "@uniswap/v3-sdk";
import JSBI from "jsbi";

const hre = require("hardhat");
const addresses = config[hre.network.config.chainId];

class UniswapOffchainQuoter {

    public quote(
        poolState: PoolState,
        tokenIn: string,
        tokenOut: string,
        amountIn: bigint
    ): [bigint, bigint] {

        const zeroForOne: boolean = tokenIn < tokenOut;
        const sqrtPriceLimitX96 = this.getSqrtPriceLimitX96(zeroForOne);

        if (amountIn <= BigInt(0)) throw new Error("Amount specified must be greater than 0");

        let state: SwapState = this.initSwapState(poolState, amountIn);

        let tickDataIndex = zeroForOne
            ? poolState.data.currentTickIndex - 1
            : poolState.data.currentTickIndex + 1;

        while (
            state.amountSpecifiedRemaining !== BigInt(0) &&
            state.sqrtPriceX96 !== sqrtPriceLimitX96 &&
            tickDataIndex >= 0 &&
            tickDataIndex < poolState.data.ticks.length
            ) {
            const tickData = poolState.data.ticks[tickDataIndex];

            let step: StepComputations = this.initStepComputations(state, tickData);

            this.updateSwapIteration(state, step, tickData, poolState.data.fee, sqrtPriceLimitX96, zeroForOne);

            tickDataIndex = zeroForOne ? tickDataIndex - 1 : tickDataIndex + 1;
        }

        // remember where we left off, so we can update pool later
        poolState.lastQuote = {
            newLiquidity: state.liquidity,
            newSqrtPriceX96: state.sqrtPriceX96,
            newTickIndex: zeroForOne ? tickDataIndex + 2 : tickDataIndex - 2
        }

        const amountOut = state.amountCalculated > BigInt(0) ? state.amountCalculated : -state.amountCalculated;
        return [amountOut, state.amountSpecifiedRemaining];
    }

    private initSwapState(poolState: PoolState, amountIn: bigint): SwapState {
        return  {
            amountSpecifiedRemaining: amountIn,
            amountCalculated: BigInt(0),
            sqrtPriceX96: poolState.data.currentSqrtPriceX96,
            tick: poolState.data.getCurrTickData().tick,
            liquidity: poolState.data.currentLiquidity
        };
    }

    private initStepComputations(state: SwapState, tickData: TickData): StepComputations {
        return {
            sqrtPriceStartX96: state.sqrtPriceX96,
            tickNext: tickData.tick,
            initialized: tickData.initialized,
            sqrtPriceNextX96: BigInt(TickMath.getSqrtRatioAtTick(Number(tickData.tick)).toString()),
            amountIn: BigInt(0),
            amountOut: BigInt(0),
            feeAmount: BigInt(0)
        };
    }

    private convertToFeeAmount(fee: bigint): FeeAmount {
        switch (fee.toString()) {
            case "100":
                return FeeAmount.LOWEST;
            case "500":
                return FeeAmount.LOW;
            case "3000":
                return FeeAmount.MEDIUM;
            case "10000":
                return FeeAmount.HIGH;
            default:
                throw new Error("Invalid fee amount");
        }
    }

    private updateSwapIteration(
        state: SwapState,
        step: StepComputations,
        tickData: TickData,
        fee: bigint,
        sqrtPriceLimitX96: bigint,
        zeroForOne: boolean
    ) {
        this.updateSwapStep(state, step, fee, sqrtPriceLimitX96, zeroForOne);
        this.calculateAmount(state, step);
        this.updateTickWithLiquidity(state, step, tickData, zeroForOne);
    }

    private updateSwapStep(
        state: SwapState,
        step: StepComputations,
        fee: bigint,
        sqrtPriceLimitX96: bigint,
        zeroForOne: boolean
    ) {
        const [sqrtPriceX96, amountIn, amountOut, feeAmount] =
            SwapMath.computeSwapStep(
                JSBI.BigInt(state.sqrtPriceX96.toString()),
                this.calculateRatioTargetX96(zeroForOne, step.sqrtPriceNextX96, sqrtPriceLimitX96),
                JSBI.BigInt(state.liquidity.toString()),
                JSBI.BigInt(state.amountSpecifiedRemaining.toString()),
                this.convertToFeeAmount(fee)
            );

        state.sqrtPriceX96 = BigInt(sqrtPriceX96.toString());
        step.amountIn = BigInt(amountIn.toString());
        step.amountOut = BigInt(amountOut.toString());
        step.feeAmount = BigInt(feeAmount.toString());
    }

    private calculateAmount(state: SwapState, step: StepComputations) {
        state.amountSpecifiedRemaining -= (step.amountIn + step.feeAmount);
        state.amountCalculated -= step.amountOut;
    }

    private updateTickWithLiquidity(
        state: SwapState,
        step: StepComputations,
        tickData: TickData,
        zeroForOne: boolean
    ) {
        if (state.sqrtPriceX96 === step.sqrtPriceNextX96) {
            // if the tick is initialized, run the tick transition
            if (step.initialized) {
                let liquidityNet = tickData.liquidityNet;
                // if we're moving leftward, we interpret liquidityNet as the opposite sign
                if (zeroForOne) {
                    liquidityNet = -liquidityNet;
                }
                const finalLiquidity = LiquidityMath.addDelta(
                    JSBI.BigInt(state.liquidity.toString()),
                    JSBI.BigInt(liquidityNet.toString())
                );
                state.liquidity = BigInt(finalLiquidity.toString());
            }
            state.tick = zeroForOne ? step.tickNext - BigInt(1) : step.tickNext;
        } else if (state.sqrtPriceX96 !== step.sqrtPriceStartX96) {
            // recompute unless we're on a lower tick boundary (i.e. already transitioned ticks), and haven't moved
            const tick = TickMath.getTickAtSqrtRatio(JSBI.BigInt(state.sqrtPriceX96.toString()));
            state.tick = BigInt(tick.toString());
        }
    }

    private calculateRatioTargetX96(
        zeroForOne: boolean,
        sqrtPriceNextX96: bigint,
        sqrtPriceLimitX96: bigint
    ): JSBI {
        return (zeroForOne ? sqrtPriceNextX96 < sqrtPriceLimitX96 : sqrtPriceNextX96 > sqrtPriceLimitX96)
            ? JSBI.BigInt(sqrtPriceLimitX96.toString())
            : JSBI.BigInt(sqrtPriceNextX96.toString());
    }

    private getSqrtPriceLimitX96(zeroForOne: boolean): bigint {
        return zeroForOne ?
            BigInt(JSBI.add(TickMath.MIN_SQRT_RATIO, JSBI.BigInt("1")).toString()) :
            BigInt(JSBI.subtract(TickMath.MAX_SQRT_RATIO, JSBI.BigInt("1")).toString());
    }
}

class UniswapState {
    private static poolStateMap: Map<string, PoolState> = new Map<string, PoolState>()
    public static quoter: UniswapOffchainQuoter = new UniswapOffchainQuoter()
    private static batch_size = 3;

    private constructor() {}

    public static getPoolState(poolAddress: string): PoolState | undefined {
        return this.poolStateMap.get(poolAddress);
    }

    private static async getPoolsDataFromContract(pools: string[], uniswapHelperContract): Promise<PoolData[]> {
        console.log("USAOOO");
        //@ts-ignore
        const rawPoolsData: any[] = await uniswapHelperContract.fetchData(pools, 15);
        return rawPoolsData.map((rawPoolData: any) => convertRowPoolData(rawPoolData))
    }


    public static async initializeFreshPoolsData(pools: string[], uniswapHelperContract) {
        const poolsSize = pools.length;
        const numberOfBatches = Math.ceil(poolsSize / this.batch_size);

        const promises: Promise<PoolData[]>[] = [];

        for (let i = 0; i < numberOfBatches; i++) {
            const batch = pools.slice(i * this.batch_size, (i + 1) * this.batch_size);
            promises.push(this.getPoolsDataFromContract(batch, uniswapHelperContract));
        }

        const allPoolsData = await Promise.all(promises);

        allPoolsData.flat().forEach((poolData: PoolData) => {
            this.poolStateMap.set(poolData.info.pool.toLowerCase(), convertInitialPoolDataToPoolState(poolData));
        });
    }
}



async function sendWethTokensToUser(toAddress, amount) {
    const iWeth = await hre.ethers.getContractAt(
        "IWeth", addresses.tokens.WETH, toAddress);
    const txResponse = await iWeth.deposit({value: amount,});
    await txResponse.wait();
}
async function sendERCTokensToUser(impersonatedAddress, tokenAddress, toAddress, amount) {
    const signer = await hre.ethers.getImpersonatedSigner(impersonatedAddress);
    const ercToken = await hre.ethers.getContractAt("IERC20", tokenAddress, signer);
    const txTransfer = await ercToken.connect(signer).transfer(toAddress, amount);
    await txTransfer.wait();
}
async function approveToContract(owner, contractAddress, tokenAddress, amount) {
    const erc20Token = await hre.ethers.getContractAt("IERC20", tokenAddress, owner);
    const tx = await erc20Token.approve(contractAddress, amount);
    await tx.wait();
}
async function deployUniswapQuoter() {
    const quoterUni = await hre.ethers.getContractAt("IQuoterV2", addresses.uniV3.quoterV2);
    return {quoterUni};
}
async function deployUniswapRouter() {
    const routerUni = await hre.ethers.getContractAt("ISwapRouter", addresses.uniV3.router);
    return {routerUni};
}
async function deployUniswapPool(poolAddress) {
    const uniswapPool = await hre.ethers.getContractAt("IUniswapV3Pool", poolAddress);
    return {uniswapPool};
}
async function deployUniswapHelper() {
    const UniswapHelper = await hre.ethers.getContractFactory("UniswapHelper");
    const uniswapHelper = await UniswapHelper.deploy();
    await uniswapHelper.waitForDeployment();
    return {uniswapHelper};
}


async function swapOnUniRight(routerUni, signer) {
    await sendERCTokensToUser(addresses.impersonate.USDC, addresses.tokens.USDC, signer, BigInt("2000000000")) // 1000 USDC
    await approveToContract(signer, addresses.uniV3.router, addresses.tokens.USDC, BigInt("100000000000000"));
    let swapParams = {
        tokenIn: addresses.tokens.USDC,
        tokenOut: addresses.tokens.GMX,
        fee: 10000,
        recipient: signer.address,
        deadline: Date.now() + 86400000,
        amountIn: BigInt("100000000"), // 100 USDC
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };
    const txSwap = await routerUni.connect(signer).exactInputSingle(swapParams);
    await txSwap.wait();
}
async function testQuoteAfterSwapOnUniRight() {
    const [addr1] = await hre.ethers.getSigners();
    const {quoterUni} = await deployUniswapQuoter();
    const {routerUni} = await deployUniswapRouter();

    let params = {
        tokenIn: addresses.tokens.USDC,
        tokenOut: addresses.tokens.GMX,
        amountIn: BigInt("100000000"), // 100 USDC
        fee: 10000,
        sqrtPriceLimitX96: 0
    }
    const quoteBefore = await quoterUni.quoteExactInputSingle.staticCall(params);
    await swapOnUniRight(routerUni, addr1);

    const quoteAfter = await quoterUni.quoteExactInputSingle.staticCall(params);
    await swapOnUniRight(routerUni, addr1);

    const secondQuoteAfter = await quoterUni.quoteExactInputSingle.staticCall(params);
    console.log("Quote before swap: ", quoteBefore[0], quoteBefore[2]);
    console.log("Quote after swap: ", quoteAfter[0], quoteAfter[2]);
    console.log("Second Quote after swap: ", secondQuoteAfter[0], secondQuoteAfter[2]);
}

///////////////////////////////////////////////////////////////////////////////////////
async function swapOnUniLeft(routerUni, signer) {
    await sendERCTokensToUser(addresses.impersonate.WBTC, addresses.tokens.WBTC, signer, BigInt("1000000000")) // 10 WBTC
    await approveToContract(signer, addresses.uniV3.router, addresses.tokens.WBTC, BigInt("1000000000")); // aprove 10 WBTC
    let swapParams = {
        tokenIn: addresses.tokens.WBTC,
        tokenOut: addresses.tokens.WETH,
        fee: 3000,
        recipient: signer.address,
        deadline: Date.now() + 86400000,
        amountIn: BigInt("500000000"), // sending 5 WBTC
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };
    const txSwap = await routerUni.connect(signer).exactInputSingle(swapParams);
    await txSwap.wait();
}
async function testQuoteAfterSwapOnUniLeft() {
    const [addr1, addr2] = await hre.ethers.getSigners();
    const {quoterUni} = await deployUniswapQuoter();
    const {routerUni} = await deployUniswapRouter();
    const {uniswapPool} = await deployUniswapPool(addresses.uniV3.wbtc_eth_pool_0_3);

    let params = {
        tokenIn: addresses.tokens.WBTC,
        tokenOut: addresses.tokens.WETH,
        amountIn: BigInt("500000000"), // 5 WBTC
        fee: 3000,
        sqrtPriceLimitX96: 0
    }
    const quoteBefore = await quoterUni.quoteExactInputSingle.staticCall(params);
    await swapOnUniLeft(routerUni, addr1);
    const quoteAfter = await quoterUni.quoteExactInputSingle.staticCall(params);
    await swapOnUniLeft(routerUni, addr1);
    const secondQuoteAfter = await quoterUni.quoteExactInputSingle.staticCall(params);

    console.log("Quote before swap: ", quoteBefore[0], quoteBefore[2]);
    console.log("Quote after swap: ", quoteAfter[0], quoteAfter[2]);
    console.log("Second Quote after swap: ", secondQuoteAfter[0], secondQuoteAfter[2]);
}
//=====================================================


async function testOffChainQuoteAfterSwapOnlyLeft() {
    const {uniswapHelper} = await deployUniswapHelper();

    const pools: string[] = [
        addresses.uniV3.wbtc_eth_pool_0_3
    ];
    await UniswapState.initializeFreshPoolsData(pools, uniswapHelper);

    const poolState = UniswapState.getPoolState(addresses.uniV3.wbtc_eth_pool_0_3.toLowerCase());
    const quoteBefore = UniswapState.quoter.quote(poolState, addresses.tokens.WBTC, addresses.tokens.WETH, BigInt("500000000")); // 5 WBTC
    console.log("Quote before:", quoteBefore[0].toString());

    updatePool(poolState);

    const quoteAfter = UniswapState.quoter.quote(poolState, addresses.tokens.WBTC, addresses.tokens.WETH, BigInt("500000000")); // 5 WBTC
    console.log("Quote after:", quoteAfter);

    updatePool(poolState);

    const quoteAfterSecond = UniswapState.quoter.quote(poolState, addresses.tokens.WBTC, addresses.tokens.WETH, BigInt("500000000")); // 5 WBTC
    console.log("Quote after second:", quoteAfterSecond);
}

async function testOffChainQuoteAfterSwapOnlyRight() {
    const {uniswapHelper} = await deployUniswapHelper();

    const pools: string[] = [
        addresses.uniV3.gmx_usdc_pool_0_1,
    ];

    await UniswapState.initializeFreshPoolsData(pools, uniswapHelper);
    const poolState = UniswapState.getPoolState(addresses.uniV3.gmx_usdc_pool_0_1.toLowerCase());

    const quoteBefore = UniswapState.quoter.quote(poolState, addresses.tokens.USDC, addresses.tokens.GMX, BigInt("100000000")); // 1000 USDC
    console.log("Quote before:", quoteBefore[0].toString());

    updatePool(poolState);

    const quoteAfter = UniswapState.quoter.quote(poolState, addresses.tokens.USDC, addresses.tokens.GMX, BigInt("100000000")); // 1000 USDC
    console.log("Quote after:", quoteAfter);

    updatePool(poolState);

    const quoteAfterSecond = UniswapState.quoter.quote(poolState, addresses.tokens.USDC, addresses.tokens.GMX, BigInt("100000000")); // 1000 USDC
    console.log("Quote after second:", quoteAfterSecond);
}



function updatePool(poolData: PoolState) {
    const lastQuote = poolData.lastQuote;
    poolData.data.currentLiquidity = lastQuote.newLiquidity;
    poolData.data.currentSqrtPriceX96 = lastQuote.newSqrtPriceX96;
    poolData.data.currentTickIndex = lastQuote.newTickIndex;
}

async function tickaTackaUni() {
    const [addr1] = await hre.ethers.getSigners();
    const {quoterUni} = await deployUniswapQuoter();
    const {routerUni} = await deployUniswapRouter();

    let paramsZeroForOne = {
        tokenIn: addresses.tokens.WBTC,
        tokenOut: addresses.tokens.WETH,
        amountIn: BigInt("500000000"), // 5 WBTC
        fee: 3000,
        sqrtPriceLimitX96: 0
    }
    let paramsOneForZero = {
        tokenIn: addresses.tokens.WETH,
        tokenOut: addresses.tokens.WBTC,
        amountIn: hre.ethers.parseEther("40"), // 40 WETH
        fee: 3000,
        sqrtPriceLimitX96: 0
    }

    let quote = await quoterUni.quoteExactInputSingle.staticCall(paramsZeroForOne);
    console.log("Quote:", quote[0].toString());
    await swapOnUniLeft(routerUni, addr1);

    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsZeroForOne);
    console.log("Quote:", quote[0].toString());
    await swapOnUniLeft(routerUni, addr1);

    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsOneForZero);
    console.log("Quote:", quote[0].toString());
    await swapOnUniRight(routerUni, addr1);

    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsOneForZero);
    console.log("Quote:", quote[0].toString());
    await swapOnUniRight(routerUni, addr1);

    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsOneForZero);
    console.log("Quote:", quote[0].toString());
    await swapOnUniRight(routerUni, addr1);

    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsZeroForOne);
    console.log("Quote:", quote[0].toString());
    await swapOnUniLeft(routerUni, addr1);

    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsZeroForOne);
    console.log("Quote:", quote[0].toString());
    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsOneForZero);
    console.log("Quote:", quote[0].toString());
}

async function tickaTackaMy() {
    const {uniswapHelper} = await deployUniswapHelper();
    const pools: string[] = [
        addresses.uniV3.wbtc_eth_pool_0_3,
    ];
    await UniswapState.initializeFreshPoolsData(pools, uniswapHelper);
    const poolState = UniswapState.getPoolState(addresses.uniV3.wbtc_eth_pool_0_3.toLowerCase());

    const zeroForOneAmount = BigInt("500000000"); // 5 WBTC
    const oneForZeroAmount = hre.ethers.parseEther("40"); // 40 WETH

    let quote = UniswapState.quoter.quote(poolState, addresses.tokens.WBTC, addresses.tokens.WETH, zeroForOneAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);

    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WBTC, addresses.tokens.WETH, zeroForOneAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);

    poolState.data.currentTickIndex -= 1;

    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WETH, addresses.tokens.WBTC, oneForZeroAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);

    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WETH, addresses.tokens.WBTC, oneForZeroAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);

    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WETH, addresses.tokens.WBTC, oneForZeroAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);

    poolState.data.currentTickIndex += 1;

    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WBTC, addresses.tokens.WETH, zeroForOneAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);

    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WBTC, addresses.tokens.WETH, zeroForOneAmount);
    console.log("Quote:", quote[0].toString());
    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WETH, addresses.tokens.WBTC, oneForZeroAmount);
    console.log("Quote:", quote[0].toString());
}

async function rightLeftUni() {
    const [addr1] = await hre.ethers.getSigners();
    const {quoterUni} = await deployUniswapQuoter();
    const {routerUni} = await deployUniswapRouter();

    let paramsZeroForOne = {
        tokenIn: addresses.tokens.WBTC,
        tokenOut: addresses.tokens.WETH,
        amountIn: BigInt("200000000"), // 5 WBTC
        fee: 3000,
        sqrtPriceLimitX96: 0
    }
    let paramsOneForZero = {
        tokenIn: addresses.tokens.WETH,
        tokenOut: addresses.tokens.WBTC,
        amountIn: hre.ethers.parseEther("30"), // 40 WETH
        fee: 3000,
        sqrtPriceLimitX96: 0
    }

    let quote = await quoterUni.quoteExactInputSingle.staticCall(paramsOneForZero);
    console.log("Quote:", quote[0].toString());
    await swapOnUniRight(routerUni, addr1);

    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsOneForZero);
    console.log("Quote:", quote[0].toString());
    await swapOnUniRight(routerUni, addr1);

    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsZeroForOne);
    console.log("Quote:", quote[0].toString());
    await swapOnUniLeft(routerUni, addr1);

    quote = await quoterUni.quoteExactInputSingle.staticCall(paramsZeroForOne);
    console.log("Quote:", quote[0].toString());
    await swapOnUniLeft(routerUni, addr1);
}

async function rightLeftMy() {
    const {uniswapHelper} = await deployUniswapHelper();
    const pools: string[] = [
        addresses.uniV3.wbtc_eth_pool_0_3,
    ];
    await UniswapState.initializeFreshPoolsData(pools, uniswapHelper);
    const poolState = UniswapState.getPoolState(addresses.uniV3.wbtc_eth_pool_0_3.toLowerCase());

    const zeroForOneAmount = BigInt("200000000"); // 5 WBTC
    const oneForZeroAmount = hre.ethers.parseEther("30"); // 40 WETH

    let quote = UniswapState.quoter.quote(poolState, addresses.tokens.WETH, addresses.tokens.WBTC, oneForZeroAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);

    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WETH, addresses.tokens.WBTC, oneForZeroAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);

    poolState.data.currentTickIndex += 1;

    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WBTC, addresses.tokens.WETH, zeroForOneAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);

    quote = UniswapState.quoter.quote(poolState, addresses.tokens.WBTC, addresses.tokens.WETH, zeroForOneAmount);
    console.log("Quote:", quote[0].toString());
    updatePool(poolState);
}


async function main() {
    //await testQuoteAfterSwapOnUniRight();
    await testOffChainQuoteAfterSwapOnlyRight();

    //await testQuoteAfterSwapOnUniLeft();
    //await testOffChainQuoteAfterSwapOnlyLeft();

    //await tickaTackaUni();
    //await tickaTackaMy();

    //await rightLeftUni();
    //await rightLeftMy();
}

main();