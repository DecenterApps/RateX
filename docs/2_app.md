# The App
The app consists of 3 parts:
1. UI/UX
2. SDK (routing logic)
3. Solidity (pool data retrieval and swap execution)

The flow graph of the app can be seen in the next chapter.

## How the app looks
<div style="flex: 1;">
    <img src="images/ui.png"
         alt="Sql to Mongo parser"
         style="max-width: 100%;" />
  </div>

## How to run

### Run locally
Fill in contracts/.env and UI/.env files (only the RPC provider part - alchemy key).
Position yourself in the RateX/contracts files and run:
```
npx hardhat node                                                - starting a local hardhat fork
npx hardhat run scripts/deploy.js --network localhost           - deploys smart contracts
npx hardhat run scrips/fundHardhat.js --network localhost       - funds the first hardhat account
```
Then, from the RateX folder run `npm start`.

### Run on a Tenderly fork
Create a [Tenderly](https://tenderly.co/) fork and fill in contracts/.env and UI/.env files.
Position yourself in the RateX/contracts folder and run:
```
npx hardhat node
npx hardhat run scripts/deploy.js --network tenderly            - deploys smart contracts
npx hardhat run scrips/fundTenderly.js --network tenderly       - funds the first wallet account
```
Then, from the RateX folder run `npm start`.

