import {SushiSwapHelperAbi} from "./SushiSwapHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const sushiSwapHelperAddress: string =  '0xa61dB548EC834E1C74113Cd86Bd1F8f9fDd6EF22'

export const SushiSwapHelperContract = new web3.eth.Contract(
    SushiSwapHelperAbi,
    sushiSwapHelperAddress
);