import {BalancerABI} from "./BalancerABI";
import Web3 from "web3";


import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const balancerAddress: string =  '0x87C590778B35381A631824e835298286dd63f160'

export const BalancerContract = new web3.eth.Contract(
    BalancerABI,
    balancerAddress
);