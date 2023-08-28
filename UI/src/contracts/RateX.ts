import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0x84957dfF712ea1B6520d7a09Df8AFa458D8EBa48'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);