import {BalancerABI} from "./BalancerABI";
import Web3 from "web3";


import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const balancerAddress: string =  '0x0c7AD82b52Dc7f609B92bD32D1F8fbb7c0D124a7'

export const BalancerContract = new web3.eth.Contract(
    BalancerABI,
    balancerAddress
);