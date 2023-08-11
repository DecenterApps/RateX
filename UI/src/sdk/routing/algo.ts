import { assert } from "ethers"
import { PriorityQueue } from "tstl"
// let Contract = require('web3-eth-contract')

// const contractABI: any = []
// const contractAddress = ''
// const poolProvider = new Contract(contractABI, contractAddress)


const pools = [
    {
        id: "1",
        reserveA: 1,
        reserveB: 1000,
        idTokenA: 'a',
        idTokenB: 'b',
        amountOut: 500,
        fee: 0.003
    },
    {
        id: "2",
        reserveA: 1,
        reserveB: 2000,
        idTokenA: 'a',
        idTokenB: 'b',
        amountOut: 800,
        fee: 0.003
    },
    {
        id: "3",
        reserveA: 1,
        reserveB: 1000,
        idTokenA: 'b',
        idTokenB: 'c',
        amountOut: 600,
        fee: 0.003
    },
    {
        id: "4",
        reserveA: 1,
        reserveB: 500,
        idTokenA: 'a',
        idTokenB: 'c',
        amountOut: 400,
        fee: 0.003
    }
]

function createPoolMap(pools: any) {
    const poolMap = new Map<string, [string, string, number, number, number]>()
    for (let i = 0; i < pools.length; i++) {
        const pool = pools[i]
        poolMap.set(pool.id, [pool.idTokenA, pool.idTokenB, pool.reserveA, pool.reserveB, pool.fee])
    }
    return poolMap
}
const poolMap = createPoolMap(pools)

function createTokenToNumberMap(pools: any) {
    const tokenToNumber = new Map<string, number>()
    const numberToToken = new Map<number, string>()

    let cnt = 1
    for (let i = 0; i < pools.length; i++) {
        const idTokenA = pools[i].idTokenA
        const idTokenB = pools[i].idTokenB
        if (!tokenToNumber.has(idTokenA)) {
            tokenToNumber.set(idTokenA, cnt++)
            numberToToken.set(cnt - 1, idTokenA)
        }
        if (!tokenToNumber.has(idTokenB)) {
            tokenToNumber.set(idTokenB, cnt++)
            numberToToken.set(cnt - 1, idTokenB)
        }
    }
    return [tokenToNumber, numberToToken]
}

function getSwapPrice(amountA: number, reserveA: number, reserveB: number, fee: number = 0.003) {
    // Calculate the price of tokenA -> tokenB with certian fee
    const k = reserveA * reserveB
    const amountB = reserveB - k / (reserveA + amountA)
    const price = amountB * (1 - fee)
    return price
}

function getPoolsInfo() {
    // Call contract for pools info
    // const pools = poolProvider.methods.allPools().call() 
    // DOGOVORI SE S RAJKOM DA MI DA KOD ZA POOLS INFO
    // Get pools info from the API
    return pools
}

// Find best price for direct swapping
function directSwap(amountA: number, tokenAddressA: string, tokenAddressB: string) {
    // Direct swap between two tokens
    const pools = getPoolsInfo()
    let bestPath: {
        expectedOut: number,
        poolId: string,
        percent: number
    } = {expectedOut: 0, poolId: "", percent: 100}
    for (const pool of pools) {
        // const reserveA = pools[i].reserveA
        // const reserveB = pools[i].reserveB
        // const price = getSwapPrice(amountA, reserveA, reserveB)
        
        // CHECK IF TOKEN PAIR IS CORRECT

        if (pool.amountOut > bestPath.expectedOut) {
            bestPath.expectedOut = pool.amountOut
            bestPath.poolId = pool.id
        }
    }
    console.log("Path: ", bestPath)
    return [bestPath]
}

function createGraph(tokenToNumber: Map<string, number>, pools: any) {
    const graph = new Map<number, Array<[string, number, number, number, number]>>()
    for (let i = 0; i < pools.length; i++) {
        const idPool = pools[i].id
        const idTokenA: number = tokenToNumber.get(pools[i].idTokenA) || 0
        const idTokenB: number = tokenToNumber.get(pools[i].idTokenB) || 0
        const reserveA = pools[i].reserveA
        const reserveB = pools[i].reserveB
        const fee = pools[i].fee
        
        if (!graph.has(idTokenA) && idTokenA !== 0) {
            graph.set(idTokenA, [])
        }
        if (!graph.has(idTokenB) && idTokenB !== 0) {
            graph.set(idTokenB, [])
        }

        graph.get(idTokenA)?.push([idPool, idTokenB, reserveA, reserveB, fee])
        graph.get(idTokenB)?.push([idPool, idTokenA, reserveB, reserveA, fee])
    }

    return graph
}

type dpInfo = {
    amountOut: number,
    path: Array<number>
}

// Finding best route
function multiHopSwap(amountA: number, tokenAddressA: string, tokenAddressB: string, max_hops: number = 4) {

    const pools = getPoolsInfo()
    const [tokenToNumber, numberToToken]: any = createTokenToNumberMap(pools)
    const graph = createGraph(tokenToNumber, pools)

    const tokenA: number = tokenToNumber.get(tokenAddressA)
    const tokenB = tokenToNumber.get(tokenAddressB)

    const dp: Map<number, Map<number, dpInfo>> = new Map<number, Map<number, dpInfo>>()

    // dp[hop][token]
    dp.set(0, new Map<number, dpInfo>())
    dp.get(0)?.set(tokenA, {amountOut: amountA, path: [tokenA]})

    const res: dpInfo = {amountOut: -1, path: []}
    for (let hop = 0; hop < max_hops-1; hop++) {
        dp.get(hop)?.forEach((tokenPathInfo, tokenIn) => {
            // console.log(tokenPathInfo, tokenIn)

            graph.get(tokenIn)?.forEach((poolInfo) => {
                // Retrieve info from each pool
                const [poolId, tokenOut, reserveIn, reserveOut, fee] = poolInfo

                // Check if we already have tokenOut in the path
                if (tokenPathInfo.path.includes(tokenOut)) {
                    return
                }

                // Calculate amountOut and find path
                const amountOut = getSwapPrice(tokenPathInfo.amountOut, reserveIn, reserveOut, fee)
                const path: Array<number> = [...tokenPathInfo.path, tokenOut]

                
                if (!dp.has(hop + 1)) {
                    // create dp[hop+1]
                    dp.set(hop + 1, new Map<number, dpInfo>())
                }

                if (!dp.get(hop + 1)?.has(tokenOut)) {
                    // create dp[hop+1][tokenOut]
                    dp.get(hop + 1)?.set(tokenOut, {amountOut: amountOut, path: path})
                }
                else if (dp.get(hop + 1)?.get(tokenOut)?.amountOut || 0 < amountOut) { 
                    // dp[hop+1][tokenOut].amountOut < amountOut
                    dp.get(hop + 1)?.set(tokenOut, {amountOut: amountOut, path: path})
                }
            })
        })
        
        // Remember best result
        if (dp.get(hop + 1)?.has(tokenB) && (dp.get(hop+1)?.get(tokenB)?.amountOut || -1) > res.amountOut) {
            res.amountOut = dp.get(hop+1)?.get(tokenB)?.amountOut || 0
            res.path = dp.get(hop+1)?.get(tokenB)?.path || []
        }
    }


    console.log("Result: ", res)
}

//
// directSwap(0.01, 'a', 'c')
//
multiHopSwap(0.01, 'a', 'c', 5)
//  routeSwap(0.01, 'a', 'c')

export {pools, createPoolMap, createTokenToNumberMap, getSwapPrice, directSwap, multiHopSwap}