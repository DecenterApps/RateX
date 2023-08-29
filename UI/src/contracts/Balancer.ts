import {BalancerABI} from "./BalancerABI";
import Web3 from "web3";


import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const balancerAddress: string =  '0x149Af67a17D1F152A1b0C849C897DFcf63ac2a14'

export const BalancerContract = new web3.eth.Contract(
    BalancerABI,
    balancerAddress
);