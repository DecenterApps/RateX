hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai")
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("./utils");
const {resolve, join} = require("path");
const fs = require("fs");

const addresses = config[hre.network.config.chainId];

async function deploySushiDex() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();

    const Lib = await hre.ethers.getContractFactory("SushiSwapV2Library");
    const lib = await Lib.deploy();
    await lib.waitForDeployment();
    const libAddr = await lib.getAddress();

    const SushiSwap = await hre.ethers.getContractFactory("SushiSwapDex", {
        signer: addr1,
        libraries: {
            SushiSwapV2Library: libAddr
        }
    });
    const sushiSwap = await SushiSwap.deploy(addresses.sushiRouter, addresses.sushiFactory);
    await sushiSwap.waitForDeployment();
    const sushiSwapAddress = await sushiSwap.getAddress();

    return {sushiSwapAddress};
}

async function deployRateX() {
    const [addr1, addr2, addr3] = await hre.ethers.getSigners();
    const { sushiSwapAddress} = await deploySushiDex();

    const RateX = await hre.ethers.getContractFactory("RateX");
    const rateX = await RateX.deploy(sushiSwapAddress);
    await rateX.waitForDeployment();

    return {rateX, addr1, addr2, addr3};
}

async function main() {
    const {rateX } = await deployRateX();

    const address = await rateX.getAddress();
    console.log("RateX address:" + address);
    saveNewAddressToFile(address);

    const RateX = await hre.artifacts.readArtifact("RateX");
    const rateXAbi = RateX.abi;
    saveAbiToFile(rateXAbi);
}

function saveAbiToFile(abi) {
    const content = `export const RateXAbi = ${ JSON.stringify(abi) }`;

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
