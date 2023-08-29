import {CurveHelperAbi} from "./CurveHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const curveHelperAddress: string =  '0xf9075D003e0F222c545D3726E014ADF53e9DD391'

export const CurveHelperContract = new web3.eth.Contract(
    CurveHelperAbi,
    curveHelperAddress
);