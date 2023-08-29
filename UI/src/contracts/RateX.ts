import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0xd1Ac2155D1dC2eecfDF4b11e7912Ae7Fd8ddA8B8'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);