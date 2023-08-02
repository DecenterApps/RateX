// import { assert } from "ethers"

// let Contract = require('web3-eth-contract')

// const contractABI: any = []
// const contractAddress = ''
// const poolProvider = new Contract(contractABI, contractAddress)

//  const pools = [
//      {
//          id: "1",
//          reserveA: 1,
//          reserveB: 1000,
//          idTokenA: 'a',
//          idTokenB: 'b',
//          fee: 0.003
//      },
//      {
//          id: "2",
//          reserveA: 1,
//          reserveB: 2000,
//          idTokenA: 'a',
//          idTokenB: 'b',
//          fee: 0.003
//      },
//      {
//          id: "3",
//          reserveA: 1,
//          reserveB: 1000,
//          idTokenA: 'b',
//          idTokenB: 'c',
//          fee: 0.003
//      },
//      {
//          id: "4",
//          reserveA: 1,
//          reserveB: 500,
//          idTokenA: 'a',
//          idTokenB: 'c',
//          fee: 0.003
//      }
//  ]
//
//  function getSwapPrice(amountA: number, reserveA: number, reserveB: number, fee: number = 0.003) {
//      // Calculate the price of tokenA -> tokenB with certian fee
//      const k = reserveA * reserveB
//      const amountB = reserveB - k / (reserveA + amountA)
//      const price = amountB * (1 - fee)
//      return price
//  }
//
//  function getPoolsInfo() {
//      // Call contract for pools info
//      // const pools = poolProvider.methods.allPools().call() 
//      // DOGOVORI SE S RAJKOM DA MI DA KOD ZA POOLS INFO
//      // Get pools info from the API
//      return pools
//  }
//
//  function directSwap(amountA: number, tokenAddressA: string, tokenAddressB: string) {
//      // Direct swap between two tokens
//      const pools = getPoolsInfo()
//      let bestPrice: number = -1
//      for (let i = 0; i < pools.length; i++) {
//          const reserveA = pools[i].reserveA
//          const reserveB = pools[i].reserveB
//          const price = getSwapPrice(amountA, reserveA, reserveB)
//          bestPrice = Math.max(bestPrice, price)
//      }
//      console.log("Price: ", bestPrice)
//  }
//
//  function dijkstraRoute(graph: Map<string, Map<string, [number, number, number]>>, tokenAddressA: string, tokenAddressB: string, amountA: number) {
//      // Dijkstra algorithm for finding the best route between two tokens
//
//      // Initialize arrays
//      const priority_queue = new Set<[number, string]>()
//      const distance = new Map<string, number>()
//      const visited = new Map<string, boolean>()
//      const previous = new Map<string, string | null>()
//
//      for (const [key, _] of graph.entries()) {
//          visited.set(key, false)
//          previous.set(key, '')
//      }
//      priority_queue.add([amountA, tokenAddressA])    // in start we have amountA of tokenAddressA
//      distance.set(tokenAddressA, 0)
//      previous.set(tokenAddressA, null)
//
//      function getBestFromSet(priority_queue: Set<[number, string]>) {
//          // Get the best token from the priority queue
//          let best: [number, string] = [-1, '']
//          for (const [price, tokenId] of priority_queue) {
//              if (price > best[0]) {
//                  best = [price, tokenId]
//              }
//          }
//          // NECE DA BRISE IZ SETA ???????
//          console.log(priority_queue, best)
//          if (best !== null) {
//              priority_queue.delete(best)
//          }
//          console.log(priority_queue, best)
//
//          return [best]
//      }
//
//      let cnt = 0
//      while (priority_queue.size > 0) {
//          // Find the token with the biggest swap amount
//          const [first] = getBestFromSet(priority_queue)
//          const [currentTokenSwapAmount, currentTokenId] : [number, string] = first
//
//          console.log("Current token: ", currentTokenId, " with swap amount: ", currentTokenSwapAmount)
//          cnt++
//          if (cnt > 1)
//              break
//
//          // Check if the token is already visited
//          if (visited.get(currentTokenId)) {
//              continue
//          }
//          // Mark the token as visited
//          visited.set(currentTokenId, true)
//          
//          // iterate through all the tokens that are connected to the current token
//          for (const [nextTokenId, nextTokenInfo] of graph.get(currentTokenId) || new Map<string, [number, number, number]>()) {
//              const [reserveA, reserveB, fee] : [number, number, number] = nextTokenInfo
//
//              const price = getSwapPrice(currentTokenSwapAmount, reserveA, reserveB, fee)
//              const nextTokenSwapAmount: number = (distance.get(nextTokenId) ? distance.get(nextTokenId) : 0) || 0
//
//              console.log("Next token: ", nextTokenId, " with swap amount: ", nextTokenSwapAmount, " and price: ", price)
//
//              // check if the price is better than the previous one
//              if (nextTokenSwapAmount < price) {
//                  distance.set(nextTokenId, price)
//                  previous.set(nextTokenId, currentTokenId)
//
//                  priority_queue.add([price, nextTokenId])
//              }
//          }
//      }
//  }
//
//  function routeSwap(amountA: number, tokenAddressA: string, tokenAddressB: string) {
//      const pools = getPoolsInfo()
//
//      const graph = new Map<string, Map<string, [number, number, number]>>()
//      for (let i = 0; i < pools.length; i++) {
//          const idPool = pools[i].id
//          const idTokenA = pools[i].idTokenA
//          const idTokenB = pools[i].idTokenB
//          const reserveA = pools[i].reserveA
//          const reserveB = pools[i].reserveB
//          const fee = pools[i].fee
//
//          if (!graph.has(idTokenA)) {
//              graph.set(idTokenA, new Map<string, [number, number, number]>())
//          }
//          if (!graph.has(idTokenB)) {
//              graph.set(idTokenB, new Map<string, [number, number, number]>())
//          }
//          
//          graph.get(idTokenA)?.set(idTokenB, [reserveA, reserveB, fee])
//          graph.get(idTokenB)?.set(idTokenA, [reserveB, reserveA, fee])
//      }
//
//      dijkstraRoute(graph, tokenAddressA, tokenAddressB, amountA)
//  }
//
//  directSwap(0.01, '', '')
//
//  // routeSwap(0.01, 'a', 'c')

export {}