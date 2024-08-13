import { Pool, PoolInfo } from '../../../types';
import { BalancerWeightedPool } from './BalancerWeightedPool';
import { CreateBalancerHelperContract } from '../../../contracts/rateX/BalancerHelper';
import Web3 from 'web3';

export class BalancerState {
    private constructor() {}

    public static async getPoolDataFromContract(pools: PoolInfo[], chainId: number, rpcProvider: Web3): Promise<Pool[]> {
        const promises = pools.map(async (pool) => {
            // return token address after '-' split
            pool.tokens.forEach((token) => token._address = token._address.split('-')[1]);

            const BalancerHelperContract = CreateBalancerHelperContract(chainId, rpcProvider);
            try {
                // @ts-ignore
                const res: any[] = await BalancerHelperContract.methods
                    .getWeightedPoolInfo(pool.poolId)
                    .call();
                
                const [decimals, invariant, tokens, balances, weights, swapFeePercentage] = [res[0], res[1], res[2], res[3], res[4], res[5]];
                const weightedPool = new BalancerWeightedPool(pool.poolId, pool.dexId, pool.tokens, balances, weights, swapFeePercentage);
                return weightedPool;
            } catch (err) {
                console.log('Weighted Get Pool Info Error: ', err);
                return null; // Handle the error as needed
            }
        });

        const newPools = await Promise.all(promises);
        // @ts-ignore
        return newPools.filter((pool) => pool !== null); // Filter out any null values
    }
}
