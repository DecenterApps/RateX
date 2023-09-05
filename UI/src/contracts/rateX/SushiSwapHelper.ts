import {SushiSwapHelperAbi} from "../abi/SushiSwapHelperAbi";
import Web3 from "web3";
import initRPCProvider from "../../providers/RPCProvider";
import {SUSHISWAP_HELPER_ADDRESS} from "../addresses";

const web3: Web3 = initRPCProvider(42161);

export const SushiSwapHelperContract = new web3.eth.Contract(
    SushiSwapHelperAbi,
    SUSHISWAP_HELPER_ADDRESS
);