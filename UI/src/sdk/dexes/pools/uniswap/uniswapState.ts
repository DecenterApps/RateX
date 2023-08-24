import {PoolData} from "./types";
import { UniswapHelperContract } from '../../../../contracts/UniswapHelper'
import {convertRowPoolData} from "./utils";
import {UniswapOffchainQuoter} from "./uniswapOffchainQuoter";

export class UniswapState {

    private static poolDataMap: Map<string, PoolData> = new Map<string, PoolData>();
    public static quoter: UniswapOffchainQuoter = new UniswapOffchainQuoter();

    private constructor() {}

    public static async getPoolData(poolAddress: string): Promise<PoolData> {
        poolAddress = poolAddress.toLowerCase();
        console.log("GAS ", poolAddress)

        if (!this.poolDataMap.has(poolAddress)) {
            console.log("Pool data not found in cache, fetching from contract");
            const p = await this.getPoolDataFromContract(poolAddress);
            this.poolDataMap.set(poolAddress, p);
            return p;
        } else {
            // check how old data is, if older than 10 seconds for example, refetch it
            console.log("Pool data found in cache");
            return this.poolDataMap.get(poolAddress) as PoolData;
        }
    }

    public static getPoolDataSync(poolAddress: string): PoolData | undefined {
        return this.poolDataMap.get(poolAddress) as PoolData;
    }

    private static async getPoolDataFromContract(poolAddress: string): Promise<PoolData> {

        //@ts-ignore
       const rawPoolData: any = await UniswapHelperContract.methods.fetchPoolData(poolAddress, 15).call();
       return convertRowPoolData(rawPoolData);
    }

    private static async getPoolsDataFromContract(pools: string[]): Promise<PoolData[]> {

        //@ts-ignore
        const rawPoolsData: any[] = await UniswapHelperContract.methods.fetchData(pools, 15).call();
        return rawPoolsData.map((rawPoolData: any) => convertRowPoolData(rawPoolData));
    }

    public static async initializeFreshPoolsData(pools: string[]) {
        const poolsData: PoolData[] = await this.getPoolsDataFromContract(pools);
        console.log("GAS? ", poolsData)
        poolsData.forEach((poolData: PoolData) => console.log(poolData.info.pool.toLowerCase()));
        poolsData.forEach((poolData: PoolData) => this.poolDataMap.set(poolData.info.pool.toLowerCase(), poolData));
    }


}