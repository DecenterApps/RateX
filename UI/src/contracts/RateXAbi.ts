export const RateXAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_sushiSwapDexAddress',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_uniswapV3DexAddress',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'string', name: '', type: 'string' }],
    name: 'dexes',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: '_dexId', type: 'string' },
      { internalType: 'address', name: '_tokenIn', type: 'address' },
      { internalType: 'address', name: '_tokenOut', type: 'address' },
      { internalType: 'uint256', name: '_amountIn', type: 'uint256' },
    ],
    name: 'quote',
    outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'poolAddress', type: 'address' },
          { internalType: 'string', name: 'dexId', type: 'string' },
        ],
        internalType: 'struct RateX.PoolEntry[]',
        name: 'poolEntries',
        type: 'tuple[]',
      },
      { internalType: 'address', name: '_tokenIn', type: 'address' },
      { internalType: 'address', name: '_tokenOut', type: 'address' },
      { internalType: 'uint256', name: '_amountIn', type: 'uint256' },
    ],
    name: 'quoteV2',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'dexId', type: 'string' },
          { internalType: 'address', name: 'poolAddress', type: 'address' },
          { internalType: 'uint256', name: 'reserveA', type: 'uint256' },
          { internalType: 'uint256', name: 'reserveB', type: 'uint256' },
          { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
        ],
        internalType: 'struct RateX.QuoteResultEntry[]',
        name: 'result',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_poolAddress', type: 'address' },
      { internalType: 'address', name: '_tokenIn', type: 'address' },
      { internalType: 'address', name: '_tokenOut', type: 'address' },
      { internalType: 'uint256', name: '_amountIn', type: 'uint256' },
      { internalType: 'uint256', name: '_minAmountOut', type: 'uint256' },
      { internalType: 'address', name: '_to', type: 'address' },
      { internalType: 'string', name: '_dexId', type: 'string' },
    ],
    name: 'swap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
