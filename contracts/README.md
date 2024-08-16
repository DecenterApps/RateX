# RateX contracts

## Getting started

1. Compile contracts

```shell
npx hardhat compile
```

2. Run tests

```shell
npx hardhat test
```

## Smart contracts scope

This project consists of the following smart contracts:

### RateX
- [RateX](./contracts/rateX/RateX.sol)

### DEX Implementation Contracts
- [UniswapV2Dex](./contracts/uniswapV2/UniswapV2Dex.sol)
- [UniswapV3Dex](./contracts/uniswapV3/UniswapV3Dex.sol)
- [SushiSwapDex](./contracts/sushiV2/SushiSwapDex.sol)
- [CamelotDex](./contracts/camelot/CamelotDex.sol)
- [BalancerDex](./contracts/balancer/BalancerDex.sol)

### DEX Helper Contracts
- [UniswapV2Helper](./contracts/uniswapV2/UniswapV2Helper.sol)
- [UniswapV3Helper](./contracts/uniswapV3/UniswapHelper.sol)
- [SushiswapHelper](./contracts/sushiV2/SushiSwapHelper.sol)
- [CamelotHelper](./contracts/camelot/CamelotHelper.sol)
- [BalancerHelper](./contracts/balancer/BalancerHelper.sol)
