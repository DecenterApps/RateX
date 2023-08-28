import {BalancerABI} from "./BalancerABI";
import Web3 from "web3";


import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const balancerAddress: string =  '0xae77949C4dBE890363E7A12b968E976E634242E9'

export const BalancerContract = new web3.eth.Contract(
    BalancerABI,
    balancerAddress
);