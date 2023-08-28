import {SushiSwapHelperAbi} from "./SushiSwapHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const sushiSwapHelperAddress: string =  '0x2dBE88AAF3660c37d90D5b39dA381EBbfA19Ece0'

export const SushiSwapHelperContract = new web3.eth.Contract(
    SushiSwapHelperAbi,
    sushiSwapHelperAddress
);