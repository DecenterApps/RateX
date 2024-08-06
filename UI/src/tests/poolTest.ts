// @ts-nocheck

import { ethers } from "ethers";
import Curve from "../sdk/dexes/graph_queries/Curve";
import { findRouteWithIterativeSplitting, getDex } from "../sdk/routing/iterative_spliting/main";
import { ERC20_ABI } from "../contracts/abi/common/ERC20_ABI";
import { RATE_X_ADDRESS as RATE_X_ADDRESS_MAINNET } from '../contracts/addresses-mainnet'
import { RATE_X_ADDRESS as RATE_X_ADDRESS_ARBITRUM } from '../contracts/addresses-arbitrum'
import { RateXAbi } from "../contracts/abi/RateXAbi";
import { transferQuoteWithBalancerPoolIdToAddress } from "../sdk/swap/solidity_communication";
import UniswapV3 from "../sdk/dexes/graph_queries/UniswapV3";
import UniswapV2 from "../sdk/dexes/graph_queries/UniswapV2";
import { myLocalStorage } from "../sdk/swap/my_local_storage";

const privateKey = 'df57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e';

async function setErc20Balance(tokenAddress, walletAddress, tokenAmount, networkId) {
    const amountBigInt = ethers.parseUnits(tokenAmount.toString(), 18);
    const value = (tokenAmount == 0) ? "0x0" : ethers.hexlify(ethers.toBeHex(amountBigInt));

    const payload = {
        jsonrpc: "2.0",
        method: "tenderly_setErc20Balance",
        params: [
            tokenAddress,
            walletAddress,
            value
        ],
        id: 1
    };

    try {
        const url = (networkId == 1)
            ? "https://rpc.tenderly.co/fork/5424345d-f910-421b-8993-621a614c7f47"
            : "https://rpc.tenderly.co/fork/91d949da-3eb9-4766-a2b9-3e4d11c5260f";

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json();
        return { ok: true };
    } catch (error) {
        return { ok: false };
    }
}

function initRPCProviderEthers(chainId: number): ethers.Provider {
    switch (chainId) {
        case 42161:
            return new ethers.JsonRpcProvider("https://rpc.tenderly.co/fork/91d949da-3eb9-4766-a2b9-3e4d11c5260f");
        case 1:
            return new ethers.JsonRpcProvider("https://rpc.tenderly.co/fork/5424345d-f910-421b-8993-621a614c7f47");
        default:
            return new ethers.JsonRpcProvider("https://mainnet.optimism.io");
    }
}

function CreateRateXContractEthers(chainId: number): ethers.Contract {
    const provider = initRPCProviderEthers(chainId);

    const walletWithProvider = new ethers.Wallet(privateKey, provider);

    if (chainId === 1) {
        return new ethers.Contract(RATE_X_ADDRESS_MAINNET, RateXAbi, walletWithProvider);
    } else {
        return new ethers.Contract(RATE_X_ADDRESS_ARBITRUM, RateXAbi, walletWithProvider);
    }
}

async function executeSwapEthers(
    tokenIn: string,
    tokenOut: string,
    quote: Quote,
    amountIn: bigint,
    minAmountOut: bigint,
    wallet: ethers.Wallet,
    chainId: number
): Promise<ResponseType> {

    const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, wallet);

    const balance: bigint = await tokenInContract.balanceOf(wallet.address);

    if (balance < amountIn) {
        return { isSuccess: false, errorMessage: 'Insufficient balance' } as ResponseType;
    }

    try {
        const RateXContract = CreateRateXContractEthers(chainId)
        await tokenInContract.approve(RateXContract.target, amountIn);

        let transactionHash: string = '';
        quote = transferQuoteWithBalancerPoolIdToAddress(quote);

        const tx = await RateXContract.swap(
            quote.routes,
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut,
            wallet.address
        );

        await tx.wait();
        transactionHash = tx.hash;

        return { isSuccess: true, txHash: transactionHash } as ResponseType;
    } catch (err: any) {
        return { isSuccess: false, errorMessage: err.message } as ResponseType;
    }
}

export const testPool = async (poolInfo, wallet, networkId) => {
    try {
        const dex = await getDex(poolInfo.dexId);
        const [pool] = await dex.getAdditionalPoolDataFromSolidity([poolInfo])
        if (!pool) {
            return false;
        }

        const tokensPairs = [[pool.getToken0(), pool.getToken1()], [pool.getToken1(), pool.getToken0()]]

        for (const tokenPair of tokensPairs) {
            // getOutputAmount

            const [tokenA, tokenB] = tokenPair;
            const amountIn = 10n ** BigInt(tokenA.decimals);
            const route = await findRouteWithIterativeSplitting(tokenA._address, tokenB._address, amountIn, [pool])
            const quote = route.quote;
            const razl = Number(10n ** BigInt(tokenB.decimals) - quote) / Number(10n ** BigInt(tokenB.decimals));

            try {
                const amountOut = route.quote

                const expectedAmountOut = amountOut;
                const slippageBigInt = BigInt(0.5 * 100)
                const minAmountOut = (amountOut * (BigInt(100) - slippageBigInt)) / BigInt(100)

                const setres = await setErc20Balance(tokenA._address, "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", 1000, networkId);
                const setres2 = await setErc20Balance(tokenB._address, "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", 0, networkId);

                if (!setres.ok || !setres2.ok) {
                    return false;
                }

                const res = await executeSwapEthers(tokenA._address, tokenB._address, route, amountIn, minAmountOut, wallet, networkId);
                if (res.isSuccess) {
                    const tokenInContract = new ethers.Contract(tokenB._address, ERC20_ABI, wallet);

                    const realAmountOut: bigint = await tokenInContract.balanceOf(wallet.address);

                    console.log("Expected amount out: ", expectedAmountOut)
                    console.log("Real amount out:     ", realAmountOut)
                    if (realAmountOut < expectedAmountOut) {
                        console.log("Bad quote (bad)");
                        return false;
                    }
                    if (realAmountOut > expectedAmountOut) {
                        console.log("Bad quote (good)");
                        return false;
                    }
                    console.log("Good quote")

                }
                else {
                    return false;
                }
            }
            catch (e) {
                console.log('Error on swap: ', e)
                return false;
            }
        }
        // swap

        return true;
    }
    catch (e) {
        console.log(e);
        return false;
    }
}