hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai");
const {config} = require("../addresses.config");
const {deployRateX, deploySushiDex, deployUniswapDex} = require("../scripts/utils/deployment");
const {sendWethTokensToUser, approveToContract, stringToUint32} = require("../scripts/utils/contract");

describe("Tests for main RateX contract", async function () {
    const SUSHI_V2_ID = stringToUint32("SUSHI_V2");
    const UNI_V3_ID = stringToUint32("UNI_V3");
    const CURVE_ID = stringToUint32("CURVE");

    const TEST_DEX_ID = stringToUint32("TEST_DEX");
    const TEST_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    const addresses = config[hre.network.config.chainId];

    const wethWbtcSwapOnSushi = {
        poolId: addresses.sushi.wbtc_eth_pool,
        tokenIn: addresses.tokens.WETH,
        tokenOut: addresses.tokens.WBTC,
        dexId: SUSHI_V2_ID
    };
    const wethWbtc_03_SwapOnUni = {
        poolId: addresses.uniV3.wbtc_eth_pool_0_3,
        tokenIn: addresses.tokens.WETH,
        tokenOut: addresses.tokens.WBTC,
        dexId: UNI_V3_ID
    };
    const usdceWbtc_005_SwapOnUni = {
        poolId: addresses.uniV3.wbtc_usdce_pool_0_05,
        tokenIn: addresses.tokens.USDCE,
        tokenOut: addresses.tokens.WBTC,
        dexId: UNI_V3_ID
    };
    const wethLinkSwapOnUni = {
        poolId: addresses.uniV3.weth_link_pool,
        tokenIn: addresses.tokens.WETH,
        tokenOut: addresses.tokens.LINK,
        dexId: UNI_V3_ID
    };
    const wethUsdce_005_SwapOnUni = {
        poolId: addresses.uniV3.weth_usdce_pool_0_05,
        tokenIn: addresses.tokens.WETH,
        tokenOut: addresses.tokens.USDCE,
        dexId: UNI_V3_ID
    };
    const wethUsdt_005_SwapOnUni = {
        poolId: addresses.uniV3.weth_usdt_pool_0_05,
        tokenIn: addresses.tokens.WETH,
        tokenOut: addresses.tokens.USDT,
        dexId: UNI_V3_ID
    };
    const usdceUsdt_001_SwapOnUni = {
        poolId: addresses.uniV3.usdt_usdce_pool_0_0_1,
        tokenIn: addresses.tokens.USDCE,
        tokenOut: addresses.tokens.USDT,
        dexId: UNI_V3_ID
    };
    const usdceUsdt_2pool_SwapOnCurve = {
        poolId: addresses.curve.curve2Pool,
        tokenIn: addresses.tokens.USDCE,
        tokenOut: addresses.tokens.USDT,
        dexId: CURVE_ID
    };

    async function deployRateXFixture() {
        return (await deployRateX());
    }

    it("Should deploy RateX contract", async function () {
        const {sushiSwap} = await deploySushiDex();
        const {uniswap} = await deployUniswapDex();
        const sushiSwapAddress = await sushiSwap.getAddress();
        const uniswapAddress = await uniswap.getAddress();

        const initialDexes = [
            {
                dexId: SUSHI_V2_ID,
                dexAddress: sushiSwapAddress
            },
            {
                dexId: UNI_V3_ID,
                dexAddress: uniswapAddress
            }
        ];

        const RateX = await hre.ethers.getContractFactory("RateX");
        const rateX = await RateX.deploy(initialDexes);
        await rateX.waitForDeployment();

        expect(await rateX.dexes(SUSHI_V2_ID)).to.equal(sushiSwapAddress);
        expect(await rateX.dexes(UNI_V3_ID)).to.equal(uniswapAddress);
    });

    it("Should add new dex", async function () {
        const {rateX} = await loadFixture(deployRateXFixture);
        const newDex = {dexId: TEST_DEX_ID, dexAddress: TEST_ADDRESS};

        const tx = await rateX.addDex(newDex);
        const txReceipt = await tx.wait();

        expect(await rateX.dexes(TEST_DEX_ID)).to.equal(TEST_ADDRESS);

        const rateXFactoryAbi = (await hre.artifacts.readArtifact("RateX")).abi;
        const event = new hre.ethers.Interface(rateXFactoryAbi).parseLog(txReceipt.logs[0]);
        const newDexId = event.args[0];
        const newDexAddress = event.args[1];

        expect(newDexId).to.equal(TEST_DEX_ID);
        expect(newDexAddress).to.equal(TEST_ADDRESS);
    });

    it("Should revert when adding new dex with existing id", async function () {
        const {rateX} = await loadFixture(deployRateXFixture);
        const newDex = {dexId: SUSHI_V2_ID, dexAddress: TEST_ADDRESS};

        await expect(rateX.addDex(newDex)).to.be.revertedWithCustomError(rateX, "RateX__DexAlreadyExists")
    });

    it("Should replace existing dex", async function () {
        const {rateX} = await loadFixture(deployRateXFixture);
        const newDex = {dexId: SUSHI_V2_ID, dexAddress: TEST_ADDRESS};
        const expectedOldDexAddress = await rateX.dexes(SUSHI_V2_ID);

        const tx = await rateX.replaceDex(newDex);
        const txReceipt = await tx.wait();

        expect(await rateX.dexes(SUSHI_V2_ID)).to.equal(TEST_ADDRESS);

        const rateXFactoryAbi = (await hre.artifacts.readArtifact("RateX")).abi;
        const event = new hre.ethers.Interface(rateXFactoryAbi).parseLog(txReceipt.logs[0]);
        const dexId = event.args[0];
        const oldDexAddress = event.args[1];
        const newDexAddress = event.args[2];

        expect(dexId).to.equal(SUSHI_V2_ID);
        expect(oldDexAddress).to.equal(expectedOldDexAddress);
        expect(newDexAddress).to.equal(TEST_ADDRESS);
    });

    it("Should revert when replacing non-existing dex", async function () {
        const {rateX} = await loadFixture(deployRateXFixture);
        const newDex = {dexId: TEST_DEX_ID, dexAddress: TEST_ADDRESS};

        await expect(rateX.replaceDex(newDex)).to.be.revertedWithCustomError(rateX, "RateX__DexDoesNotExist")
    });

    it("Should revert when replacing without authorization", async function () {
        const {rateX, addr2} = await loadFixture(deployRateXFixture);
        const newDex = {dexId: SUSHI_V2_ID, dexAddress: TEST_ADDRESS};

        await expect(rateX.connect(addr2).replaceDex(newDex))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should remove existing dex", async function () {
        const {rateX} = await loadFixture(deployRateXFixture);
        const dexToRemove = SUSHI_V2_ID;

        const tx = await rateX.removeDex(dexToRemove);
        const txReceipt = await tx.wait();

        expect(await rateX.dexes(dexToRemove)).to.equal("0x0000000000000000000000000000000000000000");

        const rateXFactoryAbi = (await hre.artifacts.readArtifact("RateX")).abi;
        const event = new hre.ethers.Interface(rateXFactoryAbi).parseLog(txReceipt.logs[0]);
        const dexId = event.args[0];
        expect(dexId).to.equal(dexToRemove);
    });

    it("Should revert when removing non-existing dex", async function () {
        const {rateX} = await loadFixture(deployRateXFixture);
        await expect(rateX.removeDex(TEST_DEX_ID)).to.be.revertedWithCustomError(rateX, "RateX__DexDoesNotExist");
    });

    it("Should revert when removing dex without authorization", async function () {
        const {rateX, addr2} = await loadFixture(deployRateXFixture);
        await expect(rateX.connect(addr2).removeDex(SUSHI_V2_ID))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert when route is empty", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        await expect(rateX.swap(
            [],
            addresses.tokens.WETH,
            addresses.tokens.DAI,
            1,
            1,
            await addr1.getAddress()
        )).to.be.revertedWithCustomError(rateX, "RateX__NoRoutes");
    });

    it("Should revert when not enough approval was given", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        await sendWethTokensToUser(addr1, 10);
        await approveToContract(addr1, await rateX.getAddress(), addresses.tokens.WETH, 1);

        await expect(rateX.swap(
            [{swaps: [wethWbtcSwapOnSushi], amountIn: 5}],
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            5,
            0,
            await addr1.getAddress()
        )).to.be.revertedWith("STF");
    });

    it("Should revert when user does not have enough founds", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        await sendWethTokensToUser(addr1, 10);
        await approveToContract(addr1, await rateX.getAddress(), addresses.tokens.WETH, 20);

        await expect(rateX.swap(
            [{swaps: [wethWbtcSwapOnSushi], amountIn: 15}],
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            15,
            0,
            await addr1.getAddress()
        )).to.be.revertedWith("STF");
    });

    it("Should revert when amount in does not match route", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        await sendWethTokensToUser(addr1, 10);
        await approveToContract(addr1, await rateX.getAddress(), addresses.tokens.WETH, 20);

        await expect(rateX.swap(
            [
                {swaps: [wethWbtcSwapOnSushi], amountIn: 15},
                {swaps: [wethWbtcSwapOnSushi], amountIn: 10}
            ],
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            30, // revert because should be 25
            0,
            await addr1.getAddress()
        )).to.be.revertedWithCustomError(rateX, "RateX__AmountInDoesNotMatch");
    });

    it("Should revert when dex does not exist", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        await sendWethTokensToUser(addr1, 10);
        await approveToContract(addr1, await rateX.getAddress(), addresses.tokens.WETH, 20);

        const swapWithInvalidDex = {
            poolId: addresses.sushi.wbtc_eth_pool,
            tokenIn: addresses.tokens.WETH,
            tokenOut: addresses.tokens.WBTC,
            dexId: stringToUint32("DEX_DOES_NOT_EXIST")
        };

        await expect(rateX.swap(
            [{swaps: [swapWithInvalidDex], amountIn: 5}],
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            5,
            0,
            await addr1.getAddress()
        )).to.be.revertedWithCustomError(rateX, "RateX__DexDoesNotExist");
    });

    it("Should revert for transfer failed when inserting invalid tokenIn in one of the routes", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("10"));
        await approveToContract(addr1, await rateX.getAddress(), addresses.tokens.WETH, hre.ethers.parseEther("10"));

        await expect(rateX.swap(
            [
                {swaps: [wethWbtcSwapOnSushi], amountIn: hre.ethers.parseEther("4")},
                // we are putting usdce as tokenIn, it should revert as contract does not have any usdce
                {swaps: [usdceWbtc_005_SwapOnUni], amountIn: hre.ethers.parseEther("4")}
            ],
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            hre.ethers.parseEther("8"),
            0,
            await addr1.getAddress()
        )).to.be.revertedWithCustomError(rateX, "RateX__DelegateCallFailed");
    });

    it("Should revert when amount out does not match", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("10"));
        await approveToContract(addr1, await rateX.getAddress(), addresses.tokens.WETH, hre.ethers.parseEther("10"));

        await expect(rateX.swap(
            [
                {swaps: [wethWbtcSwapOnSushi], amountIn: hre.ethers.parseEther("4")},
                // we are putting link as tokenOut, it should revert as contract won't get amount out
                // of wbtc token, instead part will go with link token
                {swaps: [wethLinkSwapOnUni], amountIn: hre.ethers.parseEther("4")}
            ],
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            hre.ethers.parseEther("8"),
            0,
            await addr1.getAddress()
        )).to.be.revertedWithCustomError(rateX, "RateX__AmountOutDoesNotMatch");
    });

    it("Should revert if amount out is lesser than min amount set by user", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("10"));
        await approveToContract(addr1, await rateX.getAddress(), addresses.tokens.WETH, hre.ethers.parseEther("10"));

        await expect(rateX.swap(
            [{swaps: [wethWbtcSwapOnSushi], amountIn: hre.ethers.parseEther("4")}],
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            hre.ethers.parseEther("4"),
            hre.ethers.parseEther("4"), // should revert as we won't get this much WBTC
            await addr1.getAddress()
        )).to.be.revertedWithCustomError(rateX, "RateX__AmountLesserThanMinAmount");
    })

    it("Should execute simple swap", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);
        const contractAddress = await rateX.getAddress();
        const WBTC = await hre.ethers.getContractAt("IERC20", addresses.tokens.WBTC);
        const WETH = await hre.ethers.getContractAt("IERC20", addresses.tokens.WETH);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("10"));
        await approveToContract(addr1, await rateX.getAddress(), addresses.tokens.WETH, hre.ethers.parseEther("10"));

        const balanceInWethBefore = await WETH.balanceOf(addr1);
        const amountIn = hre.ethers.parseEther("8");

        const tx = await rateX.swap(
            [
                {swaps: [wethWbtcSwapOnSushi], amountIn: hre.ethers.parseEther("4")},
                {swaps: [wethWbtc_03_SwapOnUni], amountIn: hre.ethers.parseEther("4")}
            ],
            addresses.tokens.WETH,
            addresses.tokens.WBTC,
            amountIn,
            0,
            await addr1.getAddress()
        );
        const txReceipt = await tx.wait();
        const event = txReceipt.logs[txReceipt.logs.length - 1];

        const balanceInWbtcAfter = await WBTC.balanceOf(addr1);
        const balanceInWethAfter = await WETH.balanceOf(addr1);

        const argTokenIn = event.args[0];
        const argTokenOut = event.args[1];
        const argAmountIn = event.args[2];
        const argAmountOut = event.args[3];
        const argRecipient = event.args[4];

        expect(argTokenIn).to.equal(addresses.tokens.WETH);
        expect(argTokenOut).to.equal(addresses.tokens.WBTC);
        expect(argAmountIn).to.equal(amountIn);
        expect(argRecipient).to.equal(await addr1.getAddress());
        expect(balanceInWbtcAfter).to.equal(argAmountOut);
        expect(BigInt(balanceInWethBefore) - BigInt(balanceInWethAfter)).to.equal(BigInt(argAmountIn));

        const contractWethBalance = await WETH.balanceOf(contractAddress);
        const contractWbtcBalance = await WBTC.balanceOf(contractAddress);

        // make sure no money is left on contract
        expect(contractWethBalance).to.equal(0);
        expect(contractWbtcBalance).to.equal(0);
    });

    it("Should execute complex swap", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        const WETH = await hre.ethers.getContractAt("IERC20", addresses.tokens.WETH);
        const USDT = await hre.ethers.getContractAt("IERC20", addresses.tokens.USDT);

        await sendWethTokensToUser(addr1, hre.ethers.parseEther("150"));
        await approveToContract(addr1, await rateX.getAddress(), addresses.tokens.WETH, hre.ethers.parseEther("100"));

        const balanceInWethBefore = await WETH.balanceOf(addr1);
        const amountIn = hre.ethers.parseEther("100");

        const tx = await rateX.swap(
            [
                {
                    swaps: [wethUsdce_005_SwapOnUni, usdceUsdt_2pool_SwapOnCurve],
                    amountIn: hre.ethers.parseEther("60")
                },
                {swaps: [wethUsdt_005_SwapOnUni], amountIn: hre.ethers.parseEther("35")},
                {swaps: [wethUsdce_005_SwapOnUni, usdceUsdt_001_SwapOnUni], amountIn: hre.ethers.parseEther("5")},
            ],
            addresses.tokens.WETH,
            addresses.tokens.USDT,
            amountIn,
            0,
            await addr1.getAddress()
        );
        const txReceipt = await tx.wait();
        const event = txReceipt.logs[txReceipt.logs.length - 1];

        const balanceInUsdtAfter = await USDT.balanceOf(addr1);
        const balanceInWethAfter = await WETH.balanceOf(addr1);

        const argTokenIn = event.args[0];
        const argTokenOut = event.args[1];
        const argAmountIn = event.args[2];
        const argAmountOut = event.args[3];
        const argRecipient = event.args[4];

        expect(argTokenIn).to.equal(addresses.tokens.WETH);
        expect(argTokenOut).to.equal(addresses.tokens.USDT);
        expect(argAmountIn).to.equal(amountIn);
        expect(argRecipient).to.equal(await addr1.getAddress());
        expect(balanceInUsdtAfter).to.equal(argAmountOut);
        expect(BigInt(balanceInWethBefore) - BigInt(balanceInWethAfter)).to.equal(BigInt(argAmountIn));
    });

    it("Should rescue stuck tokens", async function () {
        const {rateX, addr1} = await loadFixture(deployRateXFixture);

        const WETH = await hre.ethers.getContractAt("IERC20", addresses.tokens.WETH);
        const rateXAddress = await rateX.getAddress();
        const amount = hre.ethers.parseEther("10");

        await sendWethTokensToUser(addr1, amount);
        await WETH.transfer(rateXAddress, amount);

        const balanceInWethBefore = await WETH.balanceOf(addr1);
        const balanceInWethBeforeContract = await WETH.balanceOf(rateXAddress);
       
        const tx = await rateX.rescueFunds(addresses.tokens.WETH, addr1, amount);
        const txReceipt = await tx.wait();

        const balanceInWethAfter = await WETH.balanceOf(addr1);
        const balanceInWethAfterContract = await WETH.balanceOf(rateXAddress);

        expect(balanceInWethAfter).to.equal(balanceInWethBefore + amount);
        expect(balanceInWethAfterContract).to.equal(balanceInWethBeforeContract - amount);
    });
})
