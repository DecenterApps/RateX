import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0xe22C0E020C99e9aEd339618FdCEa2871d678Ef38'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);