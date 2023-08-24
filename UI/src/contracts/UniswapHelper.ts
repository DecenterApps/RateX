import {UniswapHelperAbi} from "./UniswapHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const uniswapHelperAddress: string =  '0x117F9741a8b0563deDAA00816302885569Cff331'

export const UniswapHelperContract = new web3.eth.Contract(
    UniswapHelperAbi,
    uniswapHelperAddress
);