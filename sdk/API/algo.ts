import { assert } from "ethers"

let Contract = require('web3-eth-contract')

const contractABI: any = []
const contractAddress = ''
const poolProvider = new Contract(contractABI, contractAddress)

const pools = [
    {
        reserveA: 1,
        reserveB: 1000
    }
]

function getSwapPrice(amountA: number, reserveA: number, reserveB: number, fee: number = 0.003) {
    // Calculate the price of tokenA -> tokenB with certian fee

    const k = reserveA * reserveB

    const amountB = reserveB - k / (reserveA + amountA)
    const price = amountB * (1 - fee)

    return price
}

function getPoolsInfo(tokenAddressA: string, tokenAddressB: string) {
    // Call contract for pools info
    // const pools = poolProvider.methods.allPools().call() 

    // DOGOVORI SE S RAJKOM DA MI DA KOD ZA POOLS INFO

    // Get pools info from the API
    return pools
}

function directSwap(amountA: number, tokenAddressA: string, tokenAddressB: string) {
    // Direct swap between two tokens
    const pools = getPoolsInfo(tokenAddressA, tokenAddressB)

    let bestPrice: number = -1
    for (let i = 0; i < pools.length; i++) {
        const reserveA = pools[i].reserveA
        const reserveB = pools[i].reserveB

        const price = getSwapPrice(amountA, reserveA, reserveB)
        bestPrice = Math.max(bestPrice, price)
    }

    console.log("Price: ", bestPrice)
}

directSwap(0.01, '', '')