import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0x39b7376Bc9CaAB68ce11376E96e17a8A7Abf851A'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);