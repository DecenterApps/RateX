import {RateXAbi} from "../abi/RateXAbi";
import Web3 from "web3";
import initRPCProvider from "../../providers/RPCProvider";
import {RATE_X_ADDRESS} from "../addresses";

const web3: Web3 = initRPCProvider(42161);

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    RATE_X_ADDRESS
);