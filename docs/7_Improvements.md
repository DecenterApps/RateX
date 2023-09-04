# Problems

- We are dependent on Graph API, which can gives outdated results, but most importanly, it can be really slow. If we could have some sort of back-end service, we could fetch info on-chain constantly and have up-to-date results.
- Out algorithms don't consider gas cost
- Uni-like algorithm doesn't calculate pools that have more than 2 tokens. That means that some Curve and Balancer pools won't be considered in this iteration.
- We don't have any sort of L2 optimization for compressing the data to achieve lower gas cost.

# Other

- Architecture could be written more cleaner (and with more comments)
- More DEXes -> Better algorithm. There is no end to integrating more decentralized exchanges.
- After fixing current issues, we could deploy this SDK to some decentralized file-hosting system (for example IPFS)
