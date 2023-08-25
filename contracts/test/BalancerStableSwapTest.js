hre = require("hardhat");
Web3 = require('web3')
const {config} = require("../addresses.config");
const {sendWethTokensToUser, approveToContract, sendERCTokensToUser} = require("../scripts/utils/contract");

const balancerVaultAbi = [{"inputs":[{"components":[{"internalType":"bytes32","name":"poolId","type":"bytes32"},{"internalType":"enum IVault.SwapKind","name":"kind","type":"uint8"},{"internalType":"contract IAsset","name":"assetIn","type":"address"},{"internalType":"contract IAsset","name":"assetOut","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"userData","type":"bytes"}],"internalType":"struct IVault.SingleSwap","name":"singleSwap","type":"tuple"},{"components":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"bool","name":"fromInternalBalance","type":"bool"},{"internalType":"address payable","name":"recipient","type":"address"},{"internalType":"bool","name":"toInternalBalance","type":"bool"}],"internalType":"struct IVault.FundManagement","name":"funds","type":"tuple"},{"internalType":"uint256","name":"limit","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swap","outputs":[{"internalType":"uint256","name":"amountCalculated","type":"uint256"}],"stateMutability":"payable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"poolId","type":"bytes32"},{"indexed":true,"internalType":"contract IERC20","name":"tokenIn","type":"address"},{"indexed":true,"internalType":"contract IERC20","name":"tokenOut","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountIn","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amountOut","type":"uint256"}],"name":"Swap","type":"event"}]
const balancerVaultAddress = '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
const addresses = config[hre.network.config.chainId];

/* ---------------- Balancer Arbitrum Stable Pool ----------------
{
  "id": "0x542f16da0efb162d20bf4358efa095b70a100f9e000000000000000000000436",
  "address": "0x542f16da0efb162d20bf4358efa095b70a100f9e",
  "poolType": "ComposableStable",
  "poolTypeVersion": 4,
  "tokens": [
    {
      "id": "0x542f16da0efb162d20bf4358efa095b70a100f9e000000000000000000000436-0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
      "decimals": 8,
      "name": "Wrapped BTC",
      "symbol": "WBTC"
    },
    {
      "id": "0x542f16da0efb162d20bf4358efa095b70a100f9e000000000000000000000436-0x542f16da0efb162d20bf4358efa095b70a100f9e",
      "decimals": 18,
      "name": "2BTC",
      "symbol": "2BTC"
    },
    {
      "id": "0x542f16da0efb162d20bf4358efa095b70a100f9e000000000000000000000436-0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40",
      "decimals": 18,
      "name": "Arbitrum tBTC v2",
      "symbol": "tBTC"
    }
  ]
}
*/

async function testOnchainAmountStable(tokenIn, tokenOut, amountIn) {

  const [owner] = await ethers.getSigners();

  /* --------------------------- Solidity structs ---------------------------
  struct SingleSwap {
    bytes32 poolId;
    SwapKind kind;
    IAsset assetIn;
    IAsset assetOut;
    uint256 amount;
    bytes userData;
  }

  struct FundManagement {
    address sender;
    bool fromInternalBalance;
    address payable recipient;
    bool toInternalBalance;
  }
  /* -------------------------------------------------------------------- */

  // ----------------- Structs for Solidity -----------------------------    
  
  const SingleSwap = {
    poolId: '0x542f16da0efb162d20bf4358efa095b70a100f9e000000000000000000000436',
    kind: 0,                       //0 = GIVEN_IN, 1 = GIVEN_OUT
    assetIn: tokenIn,
    assetOut: tokenOut,
    amount: amountIn,
    userData: '0x'
  }
  
  const FundManagement = {
    sender: owner.address,
    fromInternalBalance: false,
    recipient: owner.address,
    toInternalBalance: false
  }

  const token_limit = '1'                               // minimal amount we wish to get back        
  const deadline = new Date().getTime() + 3600*24*10    // 10 days
  //----------------------------------------------------------------   */

  const vaultContract = await hre.ethers.getContractAt(balancerVaultAbi, balancerVaultAddress);

  // send money to our account
  await sendWethTokensToUser(owner, hre.ethers.parseEther("500"));
  const impersonatedAddressWBTC = '0x7546966122e636a601a3ea4497d3509f160771d8'
  await sendERCTokensToUser(impersonatedAddressWBTC, addresses.wbtcToken, owner, "10000000000");       // 100 WBTC

  // approve contract and send tx
  let approve_amount = "10000000000"; // 100 WBTC
  await approveToContract(owner, balancerVaultAddress, addresses.wbtcToken, approve_amount);

  const txHash = await vaultContract.swap(SingleSwap, FundManagement, token_limit, deadline);
  const txReceipt = await txHash.wait();
  console.log(txReceipt.logs[1]);

}

const tokenIn = addresses.wbtcToken
const tokenOut = "0x542f16da0efb162d20bf4358efa095b70a100f9e"
const amountIn = "100000000"                                      // 1 WBTC

testOnchainAmountStable(tokenIn, tokenOut, amountIn)