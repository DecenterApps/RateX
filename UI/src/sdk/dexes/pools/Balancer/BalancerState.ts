import { Pool, PoolInfo } from '../../../types'
import { BalancerContract } from "../../../../contracts/Balancer"
import { BalancerStablePool } from './BalancerStablePool'
import { BalancerWeightedPool } from './BalancerWeightedPool'

export class BalancerState {
    private constructor() {}

    public static async getPoolDataFromContract(pools: PoolInfo[]): Promise<Pool[]> {
        let newPools: Pool[] = []

        // iterate trough pools
        for (const pool of pools) {
            // const [balancerVault, , ] = await loadFixture(await deployBalancerDex())

            // return token address after '-' split
            [pool.tokens[0]._address, pool.tokens[1]._address] = pool.tokens.map(token => token._address.split("-")[1])

            if (pool.dexId.includes("STABLE")) {
                //     returns (uint8 decimals, address[] memory tokens, uint256[] memory balances, uint256 aValue, uint256 aPrecision, uint256 feePercentage)

                // @ts-ignore
                const res: any[] = await BalancerContract.methods // @ts-ignore
                .getStablePoolInfo(pool.poolId)
                .call()
                .catch((err: any) => {
                    console.log('Stable Get Pool Info Error: ', err)
                })
                const [decimals, tokens, balances, aValue, aPrecision, swapFeePercentage] = [res[0], res[1], res[2], res[3], res[4], res[5]]

                const stablePool = new BalancerStablePool(pool.poolId.toLowerCase(), pool.dexId, pool.tokens, balances, swapFeePercentage, aValue, aPrecision)                
                newPools.push(stablePool)
            }
            else if (pool.dexId.includes("WEIGHTED")){
                //     returns (uint8 decimals, uint256 invariant, address[] memory tokens, uint256[] memory balances, uint256[] memory weights, uint256 feePercentage)

                // @ts-ignore
                const res: any[] = await BalancerContract.methods // @ts-ignore
                .getWeightedPoolInfo(pool.poolId)
                .call()
                .catch((err: any) => {
                    console.log('Weighted Get Pool Info Error: ', err)
                })
                const [decimals, invariant, tokens, balances, weights, swapFeePercentage] = [res[0], res[1], res[2], res[3], res[4], res[5]];
                
                const weightedPool = new BalancerWeightedPool(pool.poolId, pool.dexId, pool.tokens, balances, weights, swapFeePercentage)             
                newPools.push(weightedPool)
            }
            else {
                throw new Error("Dex not supported")
            }
        }
        return newPools
    }

}