# @1inch/aqua-sdk - TypeScript SDK for 1inch Aqua Protocol

A TypeScript SDK for encoding, decoding, and interacting with the 1inch Aqua Protocol smart contract. This SDK provides utilities for building transactions and parsing events for the Aqua Protocol's core operations.

## Overview

The Aqua Protocol is a decentralized protocol for liquidity management. This SDK simplifies integration by providing:

- **Encoding/Decoding**: Build typed call data for `ship`, `dock` operations
- **Event Parsing**: Decode and parse `Pushed`, `Pulled`, `Shipped`, and `Docked` events
- **Multi-Chain Support**: Pre-configured addresses for 10+ blockchain networks

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

Emitted when funds are pushed to a strategy/wallet.

```typescript
import { PushedEvent } from '@1inch/aqua-sdk'

const log = { data: '0x...', topics: ['0x...'] }
const event = PushedEvent.fromLog(log)

console.log(event.maker)        // Address
console.log(event.app)          // Address
console.log(event.strategyHash) // HexString
console.log(event.token)        // Address
console.log(event.amount)       // bigint
```

### Pulled Event

Emitted when funds are pulled from a strategy/wallet.

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

Emitted when a liquidity strategy is closed.

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

const encodedShip = AquaProtocolContract.encodeShipCallData({
  app: new Address('0x...'),
  strategy: new HexString('0x...'),
  amountsAndTokens: [ /* ... */ ],
})

const encodedDock = AquaProtocolContract.encodeDockCallData({
  app: new Address('0x...'),
  strategyHash: new HexString('0x...'),
  tokens: [ /* ... */ ],
})
```

## Supported Networks

The SDK includes pre-configured contract addresses for the following networks:

| Network | Chain ID | Address |
|---------|----------|---------|
| Ethereum | 1 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://etherscan.io/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| BNB Chain | 56 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://bscscan.com/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| Polygon | 137 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://polygonscan.com/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| Arbitrum | 42161 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://arbiscan.io/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| Avalanche | 43114 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](http://snowscan.xyz/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| Gnosis | 100 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://gnosisscan.io/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| Coinbase Base | 8453 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://basescan.org/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| Optimism | 10 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://optimistic.etherscan.io/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| zkSync Era | 324 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://era.zksync.network/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| Linea | 59144 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://lineascan.build/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| Unichain | 1301 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://uniscan.xyz/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |
| Sonic | 146 | [0x499943e74fb0ce105688beee8ef2abec5d936d31](https://sonicscan.org/address/0x499943e74fb0ce105688beee8ef2abec5d936d31) |

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

## Real-Life Examples

### Example 1: Ship Liquidity to [XYCSwap.sol](https://github.com/1inch/aqua/blob/0637013a51cd56851f7b143a1f4500fdc93726cc/src/apps/XYCSwap.sol) aqua app

Initialize a liquidity strategy by depositing tokens into Aqua's virtual balance system.

```typescriptimport { AquaProtocolContract, Address, HexString, AQUA_CONTRACT_ADDRESSES, NetworkEnum } from '@1inch/aqua-sdk'
import { encodeAbiParameters, parseUnits, http, createWalletClient, isHex } from 'viem'
import { privateKeyToAccount, privateKeyToAddress } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import assert from 'node:assert'
import 'dotenv/config'

const makerPrivateKey = process.env.MAKER_PRIVATE_KEY

assert(isHex(makerPrivateKey))
const maker = privateKeyToAddress(makerPrivateKey)
const app = '0xTODO_REPLACE'
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

// Define strategy based on the smart contract app structure. Each Aqua app can have it's own strategy schema
const strategyData = {
  maker,
  token0: WETH,
  token1: USDC,
  feeBps: 0n,
  salt: '0x0000000000000000000000000000000000000000000000000000000000000001'
} as const

// Encode strategy as bytes
const strategy = encodeAbiParameters(
  [
    {
      name: 'strategy',
      type: 'tuple',
      components: [
        { name: 'maker', type: 'address' },
        { name: 'token0', type: 'address' },
        { name: 'token1', type: 'address' },
        { name: 'feeBps', type: 'uint256' },
        { name: 'salt', type: 'bytes32' }
      ]
    }
  ],
  [strategyData]
)

console.log('Encoded strategy:', strategy)

// Initialize Aqua contract
const aqua = new AquaProtocolContract(AQUA_CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM])

// Create ship transaction
const shipTx = aqua.ship({
  app: new Address(app),
  strategy: new HexString(strategy),
  amountsAndTokens: [
    {
      token: new Address(USDC),
      amount: parseUnits('4000', 6)
    },
    {
      token: new Address(WETH),
      amount: parseUnits('1', 18)
    }
  ]
})

// Send transaction
const wallet = createWalletClient({
  chain: mainnet,
  transport: http(),
  account: privateKeyToAccount(makerPrivateKey)
})

await wallet.sendTransaction(shipTx)

```

**Full test example:** [tests/aqua.spec.ts - should ship](https://github.com/1inch/sdks/blob/master/typescript/aqua/tests/aqua.spec.ts#L27)

### Example 2: Execute a Swap through [XYCSwap.sol](https://github.com/1inch/aqua/blob/0637013a51cd56851f7b143a1f4500fdc93726cc/src/apps/XYCSwap.sol) aqua app

Execute a swap against liquidity provided through Aqua. [TestTrader.sol](https://github.com/1inch/sdks/blob/0a276af00b91b287cc4c4f04402c44e02afffa44/contracts/src/aqua/TestTrader.sol#L7) helper contract is used as an approve holder and router.

```typescript
import {
  parseUnits,
  http,
  createWalletClient,
  isHex,
  encodeFunctionData,
  decodeAbiParameters,
  publicActions
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import assert from 'node:assert'
import 'dotenv/config'

const takerPrivateKey = process.env.TAKER_PRIVATE_KEY

assert(isHex(takerPrivateKey))
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const app = '0xTODOReplace'
const routerAddress = '0xTestTraderAddress'

const strategy = '0x' // parsed from ship events or fetched from api

// Send transaction
const wallet = createWalletClient({
  chain: mainnet,
  transport: http(),
  account: privateKeyToAccount(takerPrivateKey)
}).extend(publicActions)

// decode data based on specified by app format
const [strategyData] = decodeAbiParameters(
  [
    {
      type: 'tuple',
      components: [
        { name: 'maker', type: 'address' },
        { name: 'token0', type: 'address' },
        { name: 'token1', type: 'address' },
        { name: 'feeBps', type: 'uint256' },
        { name: 'salt', type: 'bytes32' }
      ]
    }
  ],
  strategy
)

// Define swap parameters
const srcAmount = parseUnits('10', 6) // 10 USDC
const srcToken = USDC
const isZeroForOne = strategyData.token0 === srcToken

// Encode the swap call to helper Router contract
const swapData = encodeFunctionData({
  abi: [
    {
      type: 'function',
      name: 'swap',
      inputs: [
        {
          name: 'app',
          type: 'address'
        },
        {
          name: 'strategy',
          type: 'tuple',
          components: [
            { name: 'maker', type: 'address' },
            { name: 'token0', type: 'address' },
            { name: 'token1', type: 'address' },
            { name: 'feeBps', type: 'uint256' },
            { name: 'salt', type: 'bytes32' }
          ]
        },
        { name: 'zeroForOne', type: 'bool' },
        { name: 'amountIn', type: 'uint256' }
      ],
      outputs: [{ name: 'amountOut', type: 'uint256' }],
      stateMutability: 'nonpayable'
    }
  ],
  functionName: 'swap',
  args: [app, strategyData, isZeroForOne, srcAmount]
})

// give erc20 approve to routerAddress
await wallet.writeContract({
  abi: [
    {
      type: 'function',
      name: 'approve',
      inputs: [
        { name: 'spender', type: 'address', internalType: 'address' },
        { name: 'value', type: 'uint256', internalType: 'uint256' }
      ],
      outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
      stateMutability: 'nonpayable'
    }
  ],
  address: srcToken,
  account: wallet.account,
  functionName: 'approve',
  chain: wallet.chain,
  args: [routerAddress, srcAmount]
})

// Execute swap
const swapTx = await wallet.sendTransaction({
  to: routerAddress,
  data: swapData
})

await wallet.waitForTransactionReceipt({ hash: swapTx })
```

**Full test example:** [tests/aqua.spec.ts - should swap](https://github.com/1inch/sdks/blob/master/typescript/aqua/tests/aqua.spec.ts#L142)

### Example 3: Dock Liquidity

Withdraw all liquidity from a strategy and close it.

```typescript
import { AquaProtocolContract, Address, HexString, AQUA_CONTRACT_ADDRESSES, NetworkEnum } from '@1inch/aqua-sdk'
import { http, createWalletClient, isHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import assert from 'node:assert'
import 'dotenv/config'

const makerPrivateKey = process.env.MAKER_PRIVATE_KEY

assert(isHex(makerPrivateKey))
const app = '0xTODO_REPLACE'
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

const strategy = '0x' // parsed from ship events or fetched from api

// Initialize Aqua contract
const aqua = new AquaProtocolContract(AQUA_CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM])

// Create ship transaction
const shipTx = aqua.dock({
  app: new Address(app),
  strategyHash: AquaProtocolContract.calculateStrategyHash(new HexString(strategy)),
  tokens: [new Address(USDC), new Address(WETH)]
})

// Send transaction
const wallet = createWalletClient({
  chain: mainnet,
  transport: http(),
  account: privateKeyToAccount(makerPrivateKey)
})

await wallet.sendTransaction(shipTx)

// After transaction is confirmed, all virtual balances are withdrawn
// and the strategy is closed
```

**Full test example:** [tests/aqua.spec.ts - should dock](https://github.com/1inch/sdks/blob/master/typescript/aqua/tests/aqua.spec.ts#L320)

## License

This SDK is provided under the terms described in [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES).

For any licensing questions or requests, contact:
- license@degensoft.com
- legal@degensoft.com
