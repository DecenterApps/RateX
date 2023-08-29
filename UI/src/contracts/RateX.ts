import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0x6792A43fF27c2a708A85DEB8069FAA772255B631'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);