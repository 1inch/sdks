// SPDX-License-Identifier: LicenseRef-Degensoft-Aqua-Source-1.1

export const AQUA_ABI = [
  {
    type: 'function',
    name: 'dock',
    inputs: [
      { name: 'app', type: 'address', internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'tokens', type: 'address[]', internalType: 'address[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'pull',
    inputs: [
      { name: 'maker', type: 'address', internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'to', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'push',
    inputs: [
      { name: 'maker', type: 'address', internalType: 'address' },
      { name: 'app', type: 'address', internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'token', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'rawBalances',
    inputs: [
      { name: 'maker', type: 'address', internalType: 'address' },
      { name: 'app', type: 'address', internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'token', type: 'address', internalType: 'address' },
    ],
    outputs: [
      { name: 'balance', type: 'uint248', internalType: 'uint248' },
      { name: 'tokensCount', type: 'uint8', internalType: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'safeBalances',
    inputs: [
      { name: 'maker', type: 'address', internalType: 'address' },
      { name: 'app', type: 'address', internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'token0', type: 'address', internalType: 'address' },
      { name: 'token1', type: 'address', internalType: 'address' },
    ],
    outputs: [
      { name: 'balance0', type: 'uint256', internalType: 'uint256' },
      { name: 'balance1', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ship',
    inputs: [
      { name: 'app', type: 'address', internalType: 'address' },
      { name: 'strategy', type: 'bytes', internalType: 'bytes' },
      { name: 'tokens', type: 'address[]', internalType: 'address[]' },
      { name: 'amounts', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    outputs: [{ name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Docked',
    inputs: [
      { name: 'maker', type: 'address', indexed: false, internalType: 'address' },
      { name: 'app', type: 'address', indexed: false, internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Pulled',
    inputs: [
      { name: 'maker', type: 'address', indexed: false, internalType: 'address' },
      { name: 'app', type: 'address', indexed: false, internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'token', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Pushed',
    inputs: [
      { name: 'maker', type: 'address', indexed: false, internalType: 'address' },
      { name: 'app', type: 'address', indexed: false, internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'token', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Shipped',
    inputs: [
      { name: 'maker', type: 'address', indexed: false, internalType: 'address' },
      { name: 'app', type: 'address', indexed: false, internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'strategy', type: 'bytes', indexed: false, internalType: 'bytes' },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'DockingShouldCloseAllTokens',
    inputs: [
      { name: 'app', type: 'address', internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' },
    ],
  },
  {
    type: 'error',
    name: 'MaxNumberOfTokensExceeded',
    inputs: [
      { name: 'tokensCount', type: 'uint256', internalType: 'uint256' },
      { name: 'maxTokensCount', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'PushToNonActiveStrategyPrevented',
    inputs: [
      { name: 'maker', type: 'address', internalType: 'address' },
      { name: 'app', type: 'address', internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'token', type: 'address', internalType: 'address' },
    ],
  },
  {
    type: 'error',
    name: 'SafeBalancesForTokenNotInActiveStrategy',
    inputs: [
      { name: 'maker', type: 'address', internalType: 'address' },
      { name: 'app', type: 'address', internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'token', type: 'address', internalType: 'address' },
    ],
  },
  {
    type: 'error',
    name: 'SafeCastOverflowedUintDowncast',
    inputs: [
      { name: 'bits', type: 'uint8', internalType: 'uint8' },
      { name: 'value', type: 'uint256', internalType: 'uint256' },
    ],
  },
  { type: 'error', name: 'SafeTransferFromFailed', inputs: [] },
  {
    type: 'error',
    name: 'StrategiesMustBeImmutable',
    inputs: [
      { name: 'app', type: 'address', internalType: 'address' },
      { name: 'strategyHash', type: 'bytes32', internalType: 'bytes32' },
    ],
  },
] as const
