import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0x52B1CA27095283a359Cc46F1dE04f6123e289935'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);