const {resolve, join} = require("path");
const fs = require("fs");

const DIR_PATH = resolve(__dirname, '../../../UI/src/contracts');


//////////////// RATE X /////////////////////////////////////
function saveRateXAbiToFile(abi) {
    const content = `export const RateXAbi = ${JSON.stringify(abi)}`;
    const filePath = join(DIR_PATH, 'RateXAbi.ts')
    try {
        fs.writeFileSync(filePath, content)
        console.log('File written successfully')
    } catch (error) {
        console.error(`Error writing file: ${error}`)
    }
}

function saveRateXAddressToFile(address) {
    const content =
        `import {RateXAbi} from "./RateXAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const rateXAddress: string =  '${address}'

export const RateXContract = new web3.eth.Contract(
    RateXAbi,
    rateXAddress
);`;

    const filePath = join(DIR_PATH, 'RateX.ts');

    try {
        fs.writeFileSync(filePath, content);
        console.log("File written successfully");
    } catch (error) {
        console.error(`Error writing file: ${error}`);
    }
}
///////////////////////////////////////////////////////////////////////////



//////////////// UNISWAP HELPER /////////////////////////////////////
function saveUniswapHelperAbiToFile(abi) {
    const content = `export const UniswapHelperAbi = ${JSON.stringify(abi)}`;

    const filePath = join(DIR_PATH, 'UniswapHelperAbi.ts');
    try {
        fs.writeFileSync(filePath, content);
        console.log("File written successfully");
    } catch (error) {
        console.error(`Error writing file: ${error}`);
    }
}

function saveUniswapHelperAddressToFile(address) {
    const content =
        `import {UniswapHelperAbi} from "./UniswapHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const uniswapHelperAddress: string =  '${address}'

export const UniswapHelperContract = new web3.eth.Contract(
    UniswapHelperAbi,
    uniswapHelperAddress
);`;

    const filePath = join(DIR_PATH, 'UniswapHelper.ts');

    try {
        fs.writeFileSync(filePath, content);
        console.log("File written successfully");
    } catch (error) {
        console.error(`Error writing file: ${error}`);
    }
}

////////////////////////////////////////////////////////////////////////



///////////////////////////////SUSHI SWAP HELPER////////////////////////

function saveSushiSwapAbiToFile(abi) {
    const content = `export const SushiSwapHelperAbi = ${JSON.stringify(abi)}`

    const filePath = join(DIR_PATH, 'SushiSwapHelperAbi.ts')
    try {
        fs.writeFileSync(filePath, content)
        console.log('File written successfully')
    } catch (error) {
        console.error(`Error writing file: ${error}`)
    }
}

function saveSushiSwapAddressToFile(address) {
    const content = `import {SushiSwapHelperAbi} from "./SushiSwapHelperAbi";
import Web3 from "web3";

import initRPCProvider from "../providers/RPCProvider";

const web3: Web3 = initRPCProvider(42161);
export const sushiSwapHelperAddress: string =  '${address}'

export const SushiSwapHelperContract = new web3.eth.Contract(
    SushiSwapHelperAbi,
    sushiSwapHelperAddress
);`

    const filePath = join(DIR_PATH, 'SushiSwapHelper.ts')

    try {
        fs.writeFileSync(filePath, content)
        console.log('File written successfully')
    } catch (error) {
        console.error(`Error writing file: ${error}`)
    }
}
/////////////////////////////////////////////////////

module.exports = {
    saveRateXAbiToFile,
    saveRateXAddressToFile,

    saveUniswapHelperAbiToFile,
    saveUniswapHelperAddressToFile,

    saveSushiSwapAbiToFile,
    saveSushiSwapAddressToFile
}