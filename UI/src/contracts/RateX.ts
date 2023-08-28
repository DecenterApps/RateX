import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0x1AC65dF2A1d1aC5B66C32dAF500fE5218f6CeA7B'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);