import { Pool, PoolInfo } from '../../../types'
import { BalancerWeightedPool } from './BalancerWeightedPool'

let CreateBalancerHelperContract: any;

(async () => {
  import('../../../../contracts/rateX/BalancerHelper').then((module) => {
    CreateBalancerHelperContract = module.CreateBalancerHelperContract;
  });
})()

export class BalancerState {
    private constructor() {}

    public static async getPoolDataFromContract(pools: PoolInfo[], chainId: number): Promise<Pool[]> {
        let newPools: Pool[] = []

        // iterate trough pools
        for (const pool of pools) {
            // const [balancerVault, , ] = await loadFixture(await deployBalancerDex())

            // return token address after '-' split
            pool.tokens.forEach((token) => token._address = token._address.split('-')[1])

            const BalancerHelperContract = CreateBalancerHelperContract(chainId)
            // @ts-ignore
            const res: any[] = await BalancerHelperContract.methods // @ts-ignore
                .getWeightedPoolInfo(pool.poolId)
                .call()
                .catch((err: any) => {
                    console.log('Weighted Get Pool Info Error: ', err)
                })
            const [decimals, invariant, tokens, balances, weights, swapFeePercentage] = [res[0], res[1], res[2], res[3], res[4], res[5]]

            const weightedPool = new BalancerWeightedPool(pool.poolId, pool.dexId, pool.tokens, balances, weights, swapFeePercentage)
            newPools.push(weightedPool)
        }
        return newPools
    }
}
