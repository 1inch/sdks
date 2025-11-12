# @1inch/swap-vm-sdk - TypeScript SDK for 1inch Swap VM Protocol

A TypeScript SDK for encoding, decoding, and interacting with the 1inch Swap VM Protocol smart contract. This SDK provides utilities for building transactions, parsing events, and managing virtual machine instructions for the Swap VM Protocol's core operations.

## Overview

The Swap VM Protocol is a lightweight virtual machine designed for efficient and flexible token swapping on-chain. This SDK simplifies integration by providing:

- **Transaction Building**: Build typed call data for `quote`, `quoteNonView`, `swap`, and `hashOrder` operations
- **Instruction System**: Comprehensive instruction set including swaps, liquidity concentration, fees, and controls
- **Trait Management**: Handle maker and taker traits for advanced order configuration

For detailed protocol documentation, see the [Swap VM Protocol Documentation](https://github.com/1inch/swap-vm#-table-of-contents).

## Installation

```bash
pnpm add @1inch/swap-vm-sdk
```

## Quick Start

```typescript
import {
  SwapVMContract,
  SWAP_VM_CONTRACT_ADDRESSES,
  Address,
  HexString,
  NetworkEnum,
  Order,
  MakerTraits,
  TakerTraits,
} from '@1inch/swap-vm-sdk'

// Initialize the contract
const contractAddress = SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM]
const swapVm = new SwapVMContract(contractAddress)

// Create an order
const order = new Order({
  maker: new Address('0x...'),
  traits: new MakerTraits(0n),
  program: new HexString('0x...'),
})

// Build a quote transaction
const quoteTx = swapVm.quote({
  order,
  tokenIn: new Address('0x...'),
  tokenOut: new Address('0x...'),
  amount: 1000000000000000000n, // 1 token with 18 decimals
  takerTraits: TakerTraits.default(),
})

// Use the transaction data
console.log(quoteTx) // { to: '0x...', data: '0x...', value: 0n }
```

## Core Operations

### Quote

Get a quote for a swap without executing state changes (read-only).

```typescript
const quoteTx = swapVm.quote({
  order: new Order({
    maker: new Address('0x...'),
    traits: new MakerTraits(0n),
    program: new HexString('0x...'),
  }),
  tokenIn: new Address('0x...'),
  tokenOut: new Address('0x...'),
  amount: 1000000000000000000n,
  takerTraits: new TakerTraits(0n),
})
```

**Parameters:**
- `order` - The maker's order configuration including maker address, traits, and program
- `tokenIn` - The input token address
- `tokenOut` - The output token address
- `amount` - The input amount to quote
- `takerTraits` - Taker-specific traits configuration
- `takerData` - Optional additional data for hooks or extensions

**Returns:** `CallInfo` object with encoded transaction data

### Quote Non-View

Get a quote for a swap allowing state changes (non-read-only).

```typescript
const quoteNonViewTx = swapVm.quoteNonView({
  order: new Order({
    maker: new Address('0x...'),
    traits: new MakerTraits(0n),
    program: new HexString('0x...'),
  }),
  tokenIn: new Address('0x...'),
  tokenOut: new Address('0x...'),
  amount: 1000000000000000000n,
  takerTraits: new TakerTraits(0n),
})
```

**Parameters:** Same as `quote`

**Returns:** `CallInfo` object with encoded transaction data

### Swap

Execute a swap transaction with a signature.

```typescript
const swapTx = swapVm.swap({
  order: new Order({
    maker: new Address('0x...'),
    traits: new MakerTraits(0n),
    program: new HexString('0x...'),
  }),
  tokenIn: new Address('0x...'),
  tokenOut: new Address('0x...'),
  amount: 1000000000000000000n,
  takerTraits: new TakerTraits(0n),
  signature: new HexString('0x...'), // Optional if using Aqua
})
```

**Parameters:**
- All parameters from `quote`
- `signature` - Order signature (optional if using Aqua instead of signatures)

**Returns:** `CallInfo` object with encoded transaction data

### Hash Order

Calculate the hash of an order.

```typescript
const order = new Order({
  maker: new Address('0x...'),
  traits: new MakerTraits(0n),
  program: new HexString('0x...'),
})

const hashOrderTx = swapVm.hashOrder(order)
```

**Parameters:**
- `order` - The order to hash

**Returns:** `CallInfo` object with encoded transaction data for the hashOrder function

## Event Parsing

### Swapped Event

Emitted when a swap is executed.

```typescript
import { SwappedEvent } from '@1inch/swap-vm-sdk'
import { Log } from 'viem'

const log: Log = { /* ... */ }
const event = SwappedEvent.fromLog(log)

console.log(event.orderHash)    // HexString
console.log(event.maker)        // Address
console.log(event.taker)        // Address
console.log(event.tokenIn)      // Address
console.log(event.tokenOut)     // Address
console.log(event.amountIn)     // bigint
console.log(event.amountOut)    // bigint
```

## Instructions

The Swap VM uses a comprehensive instruction system for building swap programs. Available instruction categories include:

### Balances
- `SET_BALANCES_XD` - Initialize token balances
- `BALANCES_XD` - Access and manipulate token balances

### Controls
- `JUMP` - Unconditional jump to another instruction
- `JUMP_IF_EXACT_IN` - Conditional jump based on exact input
- `JUMP_IF_EXACT_OUT` - Conditional jump based on exact output
- `ONLY_TAKER_TOKEN_BALANCE_NON_ZERO` - Guard: only execute if taker token balance is non-zero
- `ONLY_TAKER_TOKEN_BALANCE_GTE` - Guard: only execute if balance >= threshold
- `ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE` - Guard: only execute if supply share >= threshold
- `SALT` - Add randomness to order hash

### Trading Instructions
- `XYC_SWAP_XD` - XYC swap for multi-dimensional pools
- `CONCENTRATE_GROW_LIQUIDITY_XD` - Concentrate liquidity in multi-dimensional pools
- `CONCENTRATE_GROW_LIQUIDITY_2D` - Concentrate liquidity in 2D pools
- `DECAY_XD` - Apply decay calculation
- `LIMIT_SWAP_1D` - Execute limit order swap
- `LIMIT_SWAP_ONLY_FULL_1D` - Execute limit order only if fully fillable
- `REQUIRE_MIN_RATE_1D` - Enforce minimum rate requirement
- `ADJUST_MIN_RATE_1D` - Adjust minimum rate dynamically
- `DUTCH_AUCTION_AMOUNT_IN_1D` - Dutch auction based on input amount
- `DUTCH_AUCTION_AMOUNT_OUT_1D` - Dutch auction based on output amount
- `ORACLE_PRICE_ADJUSTER_1D` - Adjust prices based on oracle data
- `BASE_FEE_ADJUSTER_1D` - Adjust for network base fees
- `TWAP` - Time-weighted average price swap
- `STABLE_SWAP_2D` - Stable asset swap for 2D pools
- `EXTRUCTION` - Extract additional value

### Fee Instructions
- `FLAT_FEE_XD` - Flat fee in multi-dimensional pools
- `FLAT_FEE_AMOUNT_IN_XD` - Flat fee based on input amount
- `FLAT_FEE_AMOUNT_OUT_XD` - Flat fee based on output amount
- `PROGRESSIVE_FEE_XD` - Progressive fee structure
- `PROTOCOL_FEE_AMOUNT_OUT_XD` - Protocol fee on output
- `AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD` - Aqua protocol fee on output

For detailed instruction documentation, see the [Swap VM Protocol Guide](https://github.com/1inch/swap-vm).

## Utility Functions

### Encode Call Data

Manually encode function call data if needed.

```typescript
import { SwapVMContract } from '@1inch/swap-vm-sdk'

const encoded = SwapVMContract.encodeQuoteCallData({
  order,
  tokenIn,
  tokenOut,
  amount,
  takerTraits,
})

const encodedSwap = SwapVMContract.encodeSwapCallData({
  order,
  tokenIn,
  tokenOut,
  amount,
  takerTraits,
  signature,
})

const encodedHash = SwapVMContract.encodeHashOrderCallData(order)
```

### Build Transaction Objects

Create complete transaction objects ready for signing and sending.

```typescript
import { SwapVMContract } from '@1inch/swap-vm-sdk'

const quoteTx = SwapVMContract.buildQuoteTx(contractAddress, quoteArgs)
const quoteNonViewTx = SwapVMContract.buildQuoteNonViewTx(contractAddress, quoteArgs)
const swapTx = SwapVMContract.buildSwapTx(contractAddress, swapArgs)
const hashTx = SwapVMContract.buildHashOrderTx(contractAddress, order)
```

## Supported Networks

The SDK includes pre-configured contract addresses for the following networks:

| Network | Chain ID | Address |
|---------|----------|---------|
| Ethereum | 1 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| BNB Chain | 56 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Polygon | 137 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Arbitrum | 42161 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Avalanche | 43114 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Gnosis | 100 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Coinbase Base | 8453 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Optimism | 10 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Fantom | 250 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| zkSync Era | 324 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Linea | 59144 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Unichain | 1301 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |
| Sonic | 146 | 0x11d305af1691D3aca504f6216532675f7Dd07D11 |

Access addresses using:

```typescript
import { SWAP_VM_CONTRACT_ADDRESSES } from '@1inch/swap-vm-sdk'
import { NetworkEnum } from '@1inch/sdk-core'

const ethereumAddress = SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM]
const arbitrumAddress = SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ARBITRUM]
```

## API Reference

### Exports

The SDK exports:

- **[`SwapVMContract`](./src/swap-vm-contract/swap-vm-contract.ts)** - Main contract class for encoding, decoding, and building transactions
- **[`SWAP_VM_CONTRACT_ADDRESSES`](./src/swap-vm-contract/constants.ts)** - Pre-configured contract addresses by network
- **[`SwappedEvent`](./src/swap-vm-contract/events/swapped-event.ts)** - Event class for parsing swapped events
- **[`Order`](./src/swap-vm/order.ts)** - Order data structure
- **[`MakerTraits`](./src/swap-vm/maker-traits.ts)** - Maker-side configuration and flags
- **[`TakerTraits`](./src/swap-vm/taker-traits.ts)** - Taker-side configuration and flags
- **[`ABI`](./src/abi/)** - Contract ABI exports
- **[Types](./src/swap-vm-contract/types.ts)**:
  - `QuoteArgs`
  - `QuoteNonViewArgs`
  - `SwapArgs`
  - `QuoteResult`
  - `SwapResult`
- **[Instructions](./src/swap-vm/instructions/)** - Comprehensive instruction system:
  - `balances` - Balance manipulation instructions
  - `controls` - Flow control instructions
  - `invalidators` - Cache invalidation instructions
  - `xycSwap` - XYC swap instructions
  - `concentrate` - Liquidity concentration instructions
  - `decay` - Decay calculation instructions
  - `limitSwap` - Limit order instructions
  - `minRate` - Minimum rate guard instructions
  - `dutchAuction` - Dutch auction instructions
  - `oraclePriceAdjuster` - Oracle-based price adjustment
  - `baseFeeAdjuster` - Base fee adjustment
  - `twapSwap` - Time-weighted average price instructions
  - `stableSwap` - Stable swap instructions
  - `fee` - Fee calculation instructions
  - `extruction` - Value extraction instructions