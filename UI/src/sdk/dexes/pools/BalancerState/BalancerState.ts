import { Pool, PoolInfo } from '../../../types'
import {deployBalancerDex} from "../../../../../../contracts/scripts/utils/deployment.js"
import { BalancerStablePool } from './BalancerStablePool'
import { BalancerWeightedPool } from './BalancerWeightedPool'
import BigNumber from 'bignumber.js'

const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers")

export async function callSolidityForAdditionalData(pools: PoolInfo[], dexId: string): Promise<Pool[]> {

    let newPools: Pool[] = []

    // iterate trough pools
    for (const pool of pools) {
      const [balancerVault, , ] = await loadFixture(await deployBalancerDex())

        if (pool.dexId.includes("STABLE")) {
            const [decimals, tokens, balances, aValue, aPrecision, swapFeePercentage] = await balancerVault.getPoolInfo(pool.poolId)
            // const stablePool = new BalancerStablePool(pool.poolId, dexId, tokens, balances, aValue, aPrecision, swapFeePercentage)
            // newPools.push(createStablePoolFromSolidity(pool, balances, aValue, aPrecision, swapFeePercentage))
        }
        else if (pool.dexId.includes("WEIGHTED")){
            // const [decimals, invariant, tokens, balances, weights, swapFeePercentage] = await balancerVault.getWeightedPoolInfo(pool.poolId);
            // newPools.push(createWeightedPoolFromSolidity(pool, balances, weights, swapFeePercentage))
        }
        else {
            throw new Error("Dex not supported")
        }
    }

    return newPools
}