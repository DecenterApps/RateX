type Asset = {
    address: string
    symbol: string
    name: string
    supply: number
    decimals: number
}

export class Pool {
    id: string
    name: string
    dexName: string
    chainId: string
    assets: Asset[]
    reserveETH: number
}