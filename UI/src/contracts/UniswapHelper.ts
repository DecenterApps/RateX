import {UniswapHelperAbi} from "./UniswapHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const uniswapHelperAddress: string =  '0x134a047cb02Ab5C1958949C2a157FA9DD527F484'

export const UniswapHelperContract = new web3.eth.Contract(
    UniswapHelperAbi,
    uniswapHelperAddress
);