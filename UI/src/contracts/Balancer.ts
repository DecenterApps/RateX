import {BalancerABI} from "./BalancerABI";
import Web3 from "web3";


import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const balancerAddress: string =  '0xd5DAa7CE7E3e0094a97Ec811c4fB39570aec39Cd'

export const BalancerContract = new web3.eth.Contract(
    BalancerABI,
    balancerAddress
);