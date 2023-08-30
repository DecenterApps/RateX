import {UniswapHelperAbi} from "../abi/UniswapHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../../providers/RPCProvider";
import {UNISWAP_HELPER_ADDRESS} from "../addresses";

const web3: Web3 = initRPCProvider(42161);

export const UniswapHelperContract = new web3.eth.Contract(
    UniswapHelperAbi,
    UNISWAP_HELPER_ADDRESS
);