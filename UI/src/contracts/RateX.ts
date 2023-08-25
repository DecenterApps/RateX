import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0xA83E10B6994fBE54676aB2B070278e4E9b4847c2'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);