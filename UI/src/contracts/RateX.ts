import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0x42D09E835b02293DdBAc864c83C3f9019C669226'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);