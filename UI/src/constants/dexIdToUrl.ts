import {dexIds} from "../sdk/dexes/dexIdsList";

export const dexIdToUrl: { [dexId: string]: string } = {
    'CURVE' : 'https://curve.fi/#/arbitrum/pools?search=ADDRESS',
    'SUSHI_V2' : 'https://www.sushi.com/pool/42161:ADDRESS',
    'UNI_V3' : 'https://info.uniswap.org/#/arbitrum/pools/ADDRESS',
    'CAMELOT' : 'https://info.camelot.exchange/pair/v2/ADDRESS',
    'BALANCER_V2' : 'https://app.balancer.fi/#/arbitrum/pool/ADDRESS',
}