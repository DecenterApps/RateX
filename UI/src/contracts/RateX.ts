import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0x4E56A6186983Bd4C9C77efD4210dD23652e0Fd51'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);