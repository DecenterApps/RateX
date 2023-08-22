import { Pool, PoolInfo } from '../../types'
import { CurvePool } from '../pools/Curve'
import {deployCurveDex} from "../../../../../contracts/scripts/utils/deployment.js"

const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers")

export async function callSolidityForAdditionalData(pools: PoolInfo[], dexId: string): Promise<Pool[]> {

    let newPools: Pool[] = []

    // iterate trough pools
    for (const pool of pools) {
      const [curve, , ] = await loadFixture(await deployCurveDex(pool.poolId))
      const [decimals, A, fee, balances] = await curve.getPoolInfo()

      newPools.push(createPoolFromSolidity(pool, A, fee, balances))
    }

    return newPools
}


function createPoolFromSolidity(oldPool: PoolInfo, A: string, fee: string, balances: string[]): Pool {
    return CurvePool.createFromSolidityData(oldPool, A, fee, balances)
}
