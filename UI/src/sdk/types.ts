export class PoolEntry {
    poolAddress: string;
    dexId: string;
    constructor(poolAddress: string, dexId: string) {
        this.poolAddress = poolAddress;
        this.dexId = dexId;
    }
}

export class QuoteResultEntry {
    dexId: string;
    poolAddress: string;
    reserveA: bigint;
    reserveB: bigint;
    amountOut: bigint;
    constructor(
        dexId: string,
        poolAddress: string,
        reserveA: bigint,
        reserveB: bigint,
        amountOut: bigint
    ) {
        this.dexId = dexId;
        this.poolAddress = poolAddress;
        this.reserveA = reserveA;
        this.reserveB = reserveB;
        this.amountOut = amountOut;
    }
}

export interface ResponseType {
    isSuccess: boolean;
    txHash: string;
    errorMessage: string;
}