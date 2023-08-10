hre = require("hardhat");
const {resolve, join} = require("path");
const fs = require("fs");
const {deployRateX} = require("./utils/deploymentTenderly");
const {sendWethTokensToUser, sendERCTokensToUser} = require("./utils/contract");
const {config} = require("../addresses.config");

const addresses = config[hre.network.config.chainId];

async function main() {
    const {rateX, addr1} = await deployRateX();

    await sendWethTokensToUser(addr1, hre.ethers.parseEther("1000"));

    const address = await rateX.getAddress();
    console.log("RateX address:" + address);
    saveNewAddressToFile(address);

    const RateX = await hre.artifacts.readArtifact("RateX");
    const rateXAbi = RateX.abi;
    saveAbiToFile(rateXAbi);
}

function saveAbiToFile(abi) {
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

function saveNewAddressToFile(address) {
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