import {UniswapHelperAbi} from "./UniswapHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const uniswapHelperAddress: string =  '0xe97088840912617E83441e28405b802Cdaade2DD'

export const UniswapHelperContract = new web3.eth.Contract(
    UniswapHelperAbi,
    uniswapHelperAddress
);