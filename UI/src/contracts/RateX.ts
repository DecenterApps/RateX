import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0x009B5f068Bc20a5B12030FcB72975D8bdDC4E84C'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);