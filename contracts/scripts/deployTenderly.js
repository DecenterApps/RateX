hre = require("hardhat");
const {resolve, join} = require("path");
const fs = require("fs");
const {deployRateX, deployUniswapHelper} = require("./utils/deploymentTenderly");
const {sendWethTokensToUser, sendERCTokensToUser} = require("./utils/contract");
const {config} = require("../addresses.config");

const addresses = config[hre.network.config.chainId];

async function main() {
    const {rateX, addr1} = await deployRateX();
    const {uniswapHelper} = await deployUniswapHelper();

    await sendWethTokensToUser(addr1, hre.ethers.parseEther("1000"));
    await saveRateXContract(rateX);
    await saveUniswapHelperContract(uniswapHelper);
}

async function saveUniswapHelperContract(uniswapHelperContract) {
    const address = await uniswapHelperContract.getAddress();
    console.log("UniswapHelper address:" + address);
    saveUniswapHelperAddressToFile(address);

    const UniswapHelper = await hre.artifacts.readArtifact("UniswapHelper");
    const uniswapHelperAbi = UniswapHelper.abi;
    saveUniswapHelperAbiToFile(uniswapHelperAbi);
}

async function saveRateXContract(rateXContract) {
    const address = await rateXContract.getAddress();
    console.log("RateX address:" + address);
    saveRateXAddressToFile(address);

    const RateX = await hre.artifacts.readArtifact("RateX");
    const rateXAbi = RateX.abi;
    saveRateXAbiToFile(rateXAbi);
}

function saveUniswapHelperAbiToFile(abi) {
    const content = `export const UniswapHelperAbi = ${JSON.stringify(abi)}`;

    const dirPath = resolve(__dirname, '../../UI/src/contracts');
    const filePath = join(dirPath, 'UniswapHelperAbi.ts');
    try {
        fs.writeFileSync(filePath, content);
        console.log("File written successfully");
    } catch (error) {
        console.error(`Error writing file: ${error}`);
    }
}


function saveRateXAbiToFile(abi) {
    const content = `export const RateXAbi = ${JSON.stringify(abi)}`;

    const dirPath = resolve(__dirname, '../../UI/src/contracts');
    const filePath = join(dirPath, 'RateXAbi.ts');
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


    const dirPath = resolve(__dirname, '../../UI/src/contracts');
    const filePath = join(dirPath, 'UniswapHelper.ts');

    try {
        fs.writeFileSync(filePath, content);
        console.log("File written successfully");
    } catch (error) {
        console.error(`Error writing file: ${error}`);
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

    const dirPath = resolve(__dirname, '../../UI/src/contracts');
    const filePath = join(dirPath, 'RateX.ts');

    try {
        fs.writeFileSync(filePath, content);
        console.log("File written successfully");
    } catch (error) {
        console.error(`Error writing file: ${error}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
