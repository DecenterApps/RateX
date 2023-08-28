import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '0xC51b429Cf5cf242F03e07F97F129EE540FBceAbc'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);