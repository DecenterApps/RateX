hre = require('hardhat')

const {resolve, join} = require("path");
const fs = require("fs");

function saveAbiToFile(abi, name) {
    const content = `export const ${name}Abi = ${JSON.stringify(abi)}`

    const dir_path = resolve(__dirname, '../../../UI/src/contracts/abi')
    const filePath = join(dir_path, `${name}Abi.ts`)
    try {
        fs.writeFileSync(filePath, content)
        console.log('File written successfully')
    } catch (error) {
        console.error(`Error writing file: ${error}`)
    }
}

function saveAddresses(
    rateXAddress,
    uniswapHelperAddress,
    sushiSwapHelperAddress,
    curveHelperAddress,
    camelotHelperAddress,
    balancerHelperAddress
) {

    const content = `
// chainId: ${hre.network.config.chainId}    
export const RATE_X_ADDRESS = "${rateXAddress}"
export const UNISWAP_HELPER_ADDRESS = "${uniswapHelperAddress}"
export const SUSHISWAP_HELPER_ADDRESS = "${sushiSwapHelperAddress}"
export const CURVE_HELPER_ADDRESS = "${curveHelperAddress}"
export const CAMELOT_HELPER_ADDRESS = "${camelotHelperAddress}"
export const BALANCER_HELPER_ADDRESS = "${balancerHelperAddress}"`;

    const dir_path = resolve(__dirname, '../../../UI/src/contracts')
    const filePath = join(dir_path, `addresses.ts`)
    try {
        fs.writeFileSync(filePath, content)
        console.log('File written successfully')
    } catch (error) {
        console.error(`Error writing file: ${error}`)
    }
}

module.exports = {
    saveAbiToFile,
    saveAddresses
}


