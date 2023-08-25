import { Pool, PoolInfo } from '../../types'
import { CurvePool } from '../pools/Curve'
import { deployCurveDex } from '../../../../../contracts/scripts/utils/deployment.js'

const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers')

export async function callSolidityForAdditionalData(poolsInfo: PoolInfo[], dexId: string): Promise<Pool[]> {
  let newPools: Pool[] = []

  // iterate trough pools
  for (const poolInfo of poolsInfo) {
    const [curve, ,] = await loadFixture(await deployCurveDex(poolInfo.poolId))
    const [decimals, A, fee, balances] = await curve.getPoolInfo()

    newPools.push(new CurvePool(poolInfo.poolId, poolInfo.dexId, poolInfo.tokens, A, fee, balances))
  }

  return newPools
}
