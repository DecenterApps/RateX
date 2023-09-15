# Improvements
We will give an overview of problems (what should be improved or implemented) and the steps that are missing to make this into a complete product.

## Problems
1. **Dependecy on Graph API**
    - slow (sometimes ~10 seconds), unreliable (can stop working, outdated results)
    - create a backend service that keeps track of existing pools (fetch data on-chain and have up-to-date results)
2. **Add gas cost calculations**
    - our algorithm disregards gas costs (we are counting on the fact that we are on an L2 chain)
3. **Add L2 optimizations**
    - add optimizations for compressing the data to achieve lower gas cost

## Missing for shipping
1. Cleaner architecture (+ more comments)
2. Add more dexes -> better algorithm. There is no end to integrating more decentralized exchanges (1nch currently supports 50 DEXes on Arbitrum).
3. Deploy SDK to some decentralized file-hosting system (for example IPFS)
