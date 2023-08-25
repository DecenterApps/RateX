import {SushiSwapHelperAbi} from "./SushiSwapHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const sushiSwapHelperAddress: string =  '0x4dA6A968F9E5b42cD8E5F4bd099c91EC216DE5FC'

export const SushiSwapHelperContract = new web3.eth.Contract(
    SushiSwapHelperAbi,
    sushiSwapHelperAddress
);