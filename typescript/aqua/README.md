# @1inch/aqua-sdk - TypeScript SDK for 1inch Aqua Protocol

A TypeScript SDK for encoding, decoding, and interacting with the 1inch Aqua Protocol smart contract. This SDK provides utilities for building transactions and parsing events for the Aqua Protocol's core operations.

## Overview

The Aqua Protocol is a decentralized protocol for liquidity management. This SDK simplifies integration by providing:

- **Encoding/Decoding**: Build typed call data for `ship`, `dock`, `push`, and `pull` operations
- **Event Parsing**: Decode and parse `Pushed`, `Pulled`, `Shipped`, and `Docked` events
- **Multi-Chain Support**: Pre-configured addresses for 13+ blockchain networks

For detailed protocol documentation, see the [Aqua Protocol Documentation](https://github.com/1inch/aqua#table-of-contents).

## Installation

```bash
pnpm add @1inch/aqua-sdk
```

## Quick Start

```typescript
import {
  AquaProtocolContract,
  AQUA_CONTRACT_ADDRESSES,
  Address,
  HexString,
  NetworkEnum
} from '@1inch/aqua-sdk'

// Initialize the contract
const contractAddress = AQUA_CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM]
const aqua = new AquaProtocolContract(contractAddress)

// Build a ship transaction
const shipTx = aqua.ship({
  app: new Address('0x...'),
  strategy: new HexString('0x...'),
  amountsAndTokens: [
    {
      token: new Address('0x...'),
      amount: 1000000000000000000n, // 1 token with 18 decimals
    },
  ],
})

// Use the transaction data
console.log(shipTx) // { to: '0x...', data: '0x...', value: 0n }
```

## Core Operations

### Ship

Initiates a liquidity strategy by setting virtual token balances for it.

```typescript
const shipTx = aqua.ship({
  app: new Address('0x...'),
  strategy: new HexString('0x...'),
  amountsAndTokens: [
    {
      token: new Address('0x...'),
      amount: 1000000000000000000n,
    },
  ],
})
```

**Parameters:**
- `app` - Address of the application contract
- `strategy` - Strategy bytes containing execution logic
- `amountsAndTokens` - Array of token addresses and amounts to ship

**Returns:** `CallInfo` object with encoded transaction data

### Dock

Completes a liquidity strategy by removing virtual token balances from it.

```typescript
const strategyHash = AquaProtocolContract.calculateStrategyHash(strategy)

const dockTx = aqua.dock({
  app: new Address('0x...'),
  strategyHash: strategyHash,
  tokens: [
    new Address('0x...'),
    new Address('0x...'),
  ],
})
```

**Parameters:**
- `app` - Address of the application contract
- `strategyHash` - Keccak256 hash of the strategy bytes
- `tokens` - Array of token addresses to withdraw

**Returns:** `CallInfo` object with encoded transaction data

## Event Parsing

### Pushed Event

Emitted when funds are pushed to a strategy.

```typescript
import { PushedEvent } from '@1inch/aqua-sdk'
import { Log } from 'viem'

const log: Log = { /* ... */ }
const event = PushedEvent.fromLog(log)

console.log(event.maker)        // Address
console.log(event.app)          // Address
console.log(event.strategyHash) // HexString
console.log(event.token)        // Address
console.log(event.amount)       // bigint
```

### Pulled Event

Emitted when funds are pulled from a strategy.

```typescript
import { PulledEvent } from '@1inch/aqua-sdk'

const event = PulledEvent.fromLog(log)
```

### Shipped Event

Emitted when a liquidity strategy is initiated.

```typescript
import { ShippedEvent } from '@1inch/aqua-sdk'

const event = ShippedEvent.fromLog(log)
```

### Docked Event

Emitted when a liquidity strategy is completed.

```typescript
import { DockedEvent } from '@1inch/aqua-sdk'

const event = DockedEvent.fromLog(log)
```

## Utility Functions

### Calculate Strategy Hash

Convert strategy bytes to their keccak256 hash.

```typescript
import { AquaProtocolContract } from '@1inch/aqua-sdk'
import { HexString } from '@1inch/sdk-core'

const strategy = new HexString('0x...')
const hash = AquaProtocolContract.calculateStrategyHash(strategy)
```

### Encode Call Data

Manually encode function call data if needed.

```typescript
import { AquaProtocolContract } from '@1inch/aqua-sdk'

const encoded = AquaProtocolContract.encodeShipCallData({
  app: new Address('0x...'),
  strategy: new HexString('0x...'),
  amountsAndTokens: [ /* ... */ ],
})

const encoded = AquaProtocolContract.encodeDockCallData({
  app: new Address('0x...'),
  strategyHash: new HexString('0x...'),
  tokens: [ /* ... */ ],
})
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
import { AQUA_CONTRACT_ADDRESSES } from '@1inch/aqua-sdk'
import { NetworkEnum } from '@1inch/sdk-core'

const ethereumAddress = AQUA_CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM]
const arbitrumAddress = AQUA_CONTRACT_ADDRESSES[NetworkEnum.ARBITRUM]
```

## API Reference

### Exports

The SDK exports:

- **[`AquaProtocolContract`](./src/aqua-protocol-contract/aqua-protocol-contract.ts)** - Main contract class for encoding, decoding, and building transactions
- **[`AQUA_CONTRACT_ADDRESSES`](./src/aqua-protocol-contract/constants.ts)** - Pre-configured contract addresses by network
- **[`ABI`](./src/abi/)** - Contract ABI exports
- **[Types](./src/aqua-protocol-contract/types.ts)**:
  - `ShipArgs`
  - `DockArgs`
  - `AmountsAndTokens`
  - `EventAction`
- **[Event Classes](./src/aqua-protocol-contract/events/)**:
  - `PushedEvent`
  - `PulledEvent`
  - `ShippedEvent`
  - `DockedEvent`
