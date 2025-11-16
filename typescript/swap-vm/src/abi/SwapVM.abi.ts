// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

export const SWAP_VM_ABI = [
  {
    type: 'function',
    name: 'AQUA',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IAqua' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ORDER_TYPEHASH',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'asView',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract ISwapVM' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'eip712Domain',
    inputs: [],
    outputs: [
      { name: 'fields', type: 'bytes1', internalType: 'bytes1' },
      { name: 'name', type: 'string', internalType: 'string' },
      { name: 'version', type: 'string', internalType: 'string' },
      { name: 'chainId', type: 'uint256', internalType: 'uint256' },
      { name: 'verifyingContract', type: 'address', internalType: 'address' },
      { name: 'salt', type: 'bytes32', internalType: 'bytes32' },
      { name: 'extensions', type: 'uint256[]', internalType: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hash',
    inputs: [
      {
        name: 'order',
        type: 'tuple',
        internalType: 'struct ISwapVM.Order',
        components: [
          { name: 'maker', type: 'address', internalType: 'address' },
          { name: 'traits', type: 'uint256', internalType: 'MakerTraits' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'quote',
    inputs: [
      {
        name: 'order',
        type: 'tuple',
        internalType: 'struct ISwapVM.Order',
        components: [
          { name: 'maker', type: 'address', internalType: 'address' },
          { name: 'traits', type: 'uint256', internalType: 'MakerTraits' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
      { name: 'tokenIn', type: 'address', internalType: 'address' },
      { name: 'tokenOut', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'takerTraitsAndData', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [
      { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
      { name: 'amountOut', type: 'uint256', internalType: 'uint256' },
      { name: 'orderHash', type: 'bytes32', internalType: 'bytes32' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swap',
    inputs: [
      {
        name: 'order',
        type: 'tuple',
        internalType: 'struct ISwapVM.Order',
        components: [
          { name: 'maker', type: 'address', internalType: 'address' },
          { name: 'traits', type: 'uint256', internalType: 'MakerTraits' },
          { name: 'data', type: 'bytes', internalType: 'bytes' },
        ],
      },
      { name: 'tokenIn', type: 'address', internalType: 'address' },
      { name: 'tokenOut', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'takerTraitsAndData', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [
      { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
      { name: 'amountOut', type: 'uint256', internalType: 'uint256' },
      { name: 'orderHash', type: 'bytes32', internalType: 'bytes32' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'event', name: 'EIP712DomainChanged', inputs: [], anonymous: false },
  {
    type: 'event',
    name: 'Swapped',
    inputs: [
      { name: 'orderHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
      { name: 'maker', type: 'address', indexed: false, internalType: 'address' },
      { name: 'taker', type: 'address', indexed: false, internalType: 'address' },
      { name: 'tokenIn', type: 'address', indexed: false, internalType: 'address' },
      { name: 'tokenOut', type: 'address', indexed: false, internalType: 'address' },
      { name: 'amountIn', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'amountOut', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'error',
    name: 'AquaBalanceInsufficientAfterTakerPush',
    inputs: [
      { name: 'balance', type: 'uint256', internalType: 'uint256' },
      { name: 'preBalance', type: 'uint256', internalType: 'uint256' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'BadSignature',
    inputs: [
      { name: 'maker', type: 'address', internalType: 'address' },
      { name: 'orderHash', type: 'bytes32', internalType: 'bytes32' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' },
    ],
  },
  { type: 'error', name: 'ForceApproveFailed', inputs: [] },
  { type: 'error', name: 'InvalidShortString', inputs: [] },
  { type: 'error', name: 'MakerTraitsCustomReceiverIsIncompatibleWithAqua', inputs: [] },
  { type: 'error', name: 'MakerTraitsTokenInAndTokenOutMustBeDifferent', inputs: [] },
  { type: 'error', name: 'MakerTraitsUnwrapIsIncompatibleWithAqua', inputs: [] },
  { type: 'error', name: 'MakerTraitsZeroAmountInNotAllowed', inputs: [] },
  {
    type: 'error',
    name: 'RunLoopExcessiveCall',
    inputs: [
      { name: 'pc', type: 'uint256', internalType: 'uint256' },
      { name: 'programLength', type: 'uint256', internalType: 'uint256' },
    ],
  },
  { type: 'error', name: 'SafeTransferFromFailed', inputs: [] },
  {
    type: 'error',
    name: 'StringTooLong',
    inputs: [{ name: 'str', type: 'string', internalType: 'string' }],
  },
  {
    type: 'error',
    name: 'TakerTraitsAmountOutMustBeGreaterThanZero',
    inputs: [{ name: 'amountOut', type: 'uint256', internalType: 'uint256' }],
  },
  {
    type: 'error',
    name: 'TakerTraitsExceedingMaxInputAmount',
    inputs: [
      { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
      { name: 'amountInMax', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'TakerTraitsInsufficientMinOutputAmount',
    inputs: [
      { name: 'amountOut', type: 'uint256', internalType: 'uint256' },
      { name: 'amountOutMin', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'TakerTraitsNonExactThresholdAmountIn',
    inputs: [
      { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
      { name: 'amountThreshold', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'TakerTraitsNonExactThresholdAmountOut',
    inputs: [
      { name: 'amountOut', type: 'uint256', internalType: 'uint256' },
      { name: 'amountThreshold', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'TakerTraitsTakerAmountInMismatch',
    inputs: [
      { name: 'takerAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'computedAmount', type: 'uint256', internalType: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'TakerTraitsTakerAmountOutMismatch',
    inputs: [
      { name: 'takerAmount', type: 'uint256', internalType: 'uint256' },
      { name: 'computedAmount', type: 'uint256', internalType: 'uint256' },
    ],
  },
  { type: 'error', name: 'UnexpectedLock', inputs: [] },
] as const
