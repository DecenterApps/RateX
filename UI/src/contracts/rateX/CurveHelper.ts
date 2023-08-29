import {CurveHelperAbi} from "../abi/CurveHelperAbi";
import Web3 from "web3";
import initRPCProvider from "../../providers/RPCProvider";
import {CURVE_HELPER_ADDRESS} from "../addresses";

const web3: Web3 = initRPCProvider(42161);

export const CurveHelperContract = new web3.eth.Contract(
    CurveHelperAbi,
    CURVE_HELPER_ADDRESS
);