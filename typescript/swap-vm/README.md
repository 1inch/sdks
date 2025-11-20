# @1inch/swap-vm-sdk - TypeScript SDK for 1inch Swap VM protocol

A TypeScript SDK for encoding, decoding, and interacting with the 1inch Swap VM Protocol smart contract. This SDK provides utilities for building transactions, parsing events, and managing virtual machine instructions for the Swap VM Protocol's core operations.

## Overview

The Swap VM Protocol is a lightweight virtual machine designed for efficient and flexible token swapping on-chain. This SDK simplifies integration by providing:

- **Transaction Building**: Build typed call data for `quote`, `swap`, and `hash` operations
- **Instruction System**: Comprehensive instruction set including swaps, liquidity concentration, fees, and controls
- **Trait management**: Taker and maker traits builders with sensible defaults for standard swaps, plus fine-grained control whenever you need advanced order customization.

For detailed protocol documentation, see the [Swap VM Protocol Documentation](https://github.com/1inch/swap-vm#-table-of-contents).

## Installation

```bash
pnpm add @1inch/swap-vm-sdk
```

## Quick Start

### Provide liquidity
```typescript
import {
  AQUA_SWAP_VM_CONTRACT_ADDRESSES,
  Address,
  NetworkEnum,
  Order,
  MakerTraits,
  AquaAMMStrategy
} from '@1inch/swap-vm-sdk'
import { AquaProtocolContract, AQUA_CONTRACT_ADDRESSES } from '@1inch/aqua-sdk'

const chainId = NetworkEnum.ETHEREUM
const aqua = new AquaProtocolContract(AQUA_CONTRACT_ADDRESSES[chainId])
const swapVMAddress = AQUA_SWAP_VM_CONTRACT_ADDRESSES[chainId]

const maker = '0xmaker_address'
const USDC = new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const WETH = new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')

const program = AquaAMMStrategy.new({
  tokenA: USDC,
  tokenB: WETH
}).build()

const order = Order.new({
  maker: new Address(maker),
  program,
  traits: MakerTraits.default()
})

const tx = aqua.ship({
  app: new Address(swapVMAddress),
  strategy: order.encode(),
  amountsAndTokens: [
    {
      amount: 10000n * 10n ** 6n,
      token: USDC
    },
    {
      amount: 5n * 10n ** 18n,
      token: WETH
    }
  ]
})

await makerWallet.send(tx)
```

### Swap
```typescript
import {
  Order,
  HexString,
  TakerTraits,
  Address,
  AQUA_SWAP_VM_CONTRACT_ADDRESSES,
  NetworkEnum,
  SwapVMContract,
  ABI
} from '@1inch/swap-vm-sdk'
import { decodeFunctionResult } from 'viem'

const chainId = NetworkEnum.ETHEREUM
const swapVM = new SwapVMContract(AQUA_SWAP_VM_CONTRACT_ADDRESSES[chainId])

const USDC = new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
const WETH = new Address('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')

const encodedOrder = '0x...' // fetched from ship event or from api
const order = Order.parse(new HexString(encodedOrder))

const srcAmount = 100n * 10n ** 6n
const swapParams = {
  order,
  amount: srcAmount,
  takerTraits: TakerTraits.default(),
  tokenIn: USDC,
  tokenOut: WETH
}

// Simulate the call to get the dstAmount
const simulateResult = await taker.call(swapVM.quote(swapParams))
const [_, dstAmount] = decodeFunctionResult({
  abi: ABI.SWAP_VM_ABI,
  functionName: 'quote',
  data: simulateResult.data!
})

console.log('dstAmount', dstAmount)

// Swap
const swapTx = swapVM.swap(swapParams)
await taker.send(swapTx)
```

## Contract operations

### Quote

Get a quote for a swap.

```typescript
const quoteTx = swapVm.quote({
  order: Order.parse('0x...'),
  tokenIn: new Address('0x...'),
  tokenOut: new Address('0x...'),
  amount: 1000000000000000000n,
  takerTraits: TakerTraits.default(),
})
```

**Parameters:**
- `order` - The maker's order (fetched from ship event or from api)
- `tokenIn` - The input token address
- `tokenOut` - The output token address
- `amount` - The input amount to quote
- `takerTraits` - Taker-specific traits configuration

**Returns:** `CallInfo` object with encoded transaction data

### Swap

Execute a swap transaction.

```typescript
const swapTx = swapVm.swap({
  order: Order.parse('0x...'),
  tokenIn: new Address('0x...'),
  tokenOut: new Address('0x...'),
  amount: 1000000000000000000n,
  takerTraits: TakerTraits.default(),
})
```

**Parameters:**
- All parameters from `quote`

**Returns:** `CallInfo` object with encoded transaction data

### Hash Order

Calculate the hash of an order (view).

```typescript
const order = new Order({
  maker: new Address('0x...'),
  traits: MakerTraits.default(),
  program: new HexString('0x...'),
})

const hashOrderTx = swapVm.hashOrder(order)
```

**Parameters:**
- `order` - The order to hash

**Returns:** `CallInfo` object with encoded transaction data for the `hash` order function

## Event Parsing

### Swapped Event

Emitted when a swap is executed.

```typescript
import { SwappedEvent } from '@1inch/swap-vm-sdk'

const log = { data: '0x...', topics: ['0x...'] }
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

The Swap VM uses a comprehensive instruction system for building swap programs.

🔎 **Instruction coverage vs. deployment**

- The **SDK** exposes the **full instruction set** (see `_allInstructions` in [`src/swap-vm/instructions/index.ts`](./src/swap-vm/instructions/index.ts)) and can safely **encode/decode every core opcode** defined by the protocol.
- The **currently deployed `AquaSwapVMRouter` contracts** support **only the Aqua subset** of these instructions (see `aquaInstructions` in the same file).
- Any program that uses instructions **outside `aquaInstructions`** will **not be executable on current Aqua deployments**, even though encoding/decoding will succeed.
- After the **`Fusaka` Ethereum hardfork**, a full `SwapVM` deployment is planned; at that point, programs using the complete `_allInstructions` set will be executable on-chain on Ethereum.

💡 **Gotcha**: When designing programs intended to run on today’s on-chain Aqua instances, treat `aquaInstructions` as the authoritative list of **runtime-available** opcodes, and the rest of the instruction set as **future / generic Swap VM** capabilities.

Available instruction categories in the full Swap VM instruction set include:

### Balances
- `STATIC_BALANCES_XD` - Initialize static token balances
- `DYNAMIC_BALANCES_XD` - Access and manipulate dynamic token balances

### Invalidators
- `INVALIDATE_BIT_1D` - Invalidate an order bit in the maker’s bitmap
- `INVALIDATE_TOKEN_IN_1D` - Invalidate orders by input token
- `INVALIDATE_TOKEN_OUT_1D` - Invalidate orders by output token

### Controls
- `JUMP` - Unconditional jump to another instruction
- `JUMP_IF_TOKEN_IN` - Conditional jump based on taker input token
- `JUMP_IF_TOKEN_OUT` - Conditional jump based on taker output token
- `DEADLINE` - Guard: only execute before a given timestamp
- `ONLY_TAKER_TOKEN_BALANCE_NON_ZERO` - Guard: only execute if taker token balance is non-zero
- `ONLY_TAKER_TOKEN_BALANCE_GTE` - Guard: only execute if balance >= threshold
- `ONLY_TAKER_TOKEN_SUPPLY_SHARE_GTE` - Guard: only execute if supply share >= threshold
- `SALT` - Add randomness to order hash

### Trading instructions
- `XYC_SWAP_XD` - XYC swap for multi-dimensional pools
- `CONCENTRATE_GROW_LIQUIDITY_XD` - Concentrate liquidity in multi-dimensional pools
- `CONCENTRATE_GROW_LIQUIDITY_2D` - Concentrate liquidity in 2 tokens pools
- `DECAY_XD` - Apply decay calculation
- `LIMIT_SWAP_1D` - Execute limit order swap
- `LIMIT_SWAP_ONLY_FULL_1D` - Execute limit order only if fully fillable
- `REQUIRE_MIN_RATE_1D` - Enforce minimum rate requirement
- `ADJUST_MIN_RATE_1D` - Adjust minimum rate dynamically
- `DUTCH_AUCTION_BALANCE_IN_1D` - Dutch auction based on available input balance
- `DUTCH_AUCTION_BALANCE_OUT_1D` - Dutch auction based on desired output balance
- `ORACLE_PRICE_ADJUSTER_1D` - Adjust prices based on oracle data
- `BASE_FEE_ADJUSTER_1D` - Adjust for network base fees
- `TWAP` - Time-weighted average price swap
- `EXTRUCTION` - External contract instruction

### Fee instructions
- `FLAT_FEE_AMOUNT_IN_XD` - Flat fee based on input amount
- `FLAT_FEE_AMOUNT_OUT_XD` - Flat fee based on output amount
- `PROGRESSIVE_FEE_IN_XD` - Progressive fee applied on input
- `PROGRESSIVE_FEE_OUT_XD` - Progressive fee applied on output
- `PROTOCOL_FEE_AMOUNT_OUT_XD` - Protocol fee on output
- `AQUA_PROTOCOL_FEE_AMOUNT_OUT_XD` - Aqua protocol fee on output

### Custom instruction sets & `ProgramBuilder`

Anyone can deploy a **SwapVM-compatible contract with a custom instruction set** (e.g. different opcode layout, subset, or extension of the core set) and still use this SDK to build programs for it.

The generic [`ProgramBuilder`](./src/swap-vm/programs/program-builder.ts):

- Is **instruction-set agnostic** – you inject the opcode table via the constructor as `ixsSet: IOpcode[]`.
- Can **build and decode programs** for:
  - The full `SwapVM` instruction set (`_allInstructions`)
  - The Aqua subset (`aquaInstructions`)
  - **Any custom opcode table** that matches your own contract deployment

**Take attention**:
- `ProgramBuilder.add(ix)` validates that the instruction’s opcode is present in the provided `ixsSet`.  
  - If you accidentally mix instructions from a different set, it throws with the list of supported opcode IDs.
- `ProgramBuilder.decode(program)` uses the same `ixsSet` to map opcode indices back to instruction definitions, so your **off-chain opcode table must match the on-chain contract layout**.

This makes it safe to:

- Deploy your own `SwapVM`-style contract with a custom opcode mapping.
- Use `ProgramBuilder` with your custom `ixsSet` to construct and parse programs for that deployment, without changing the rest of the SDK.

### Recommended builder for Aqua strategies

For strategies intended to run on **today’s deployed `AquaSwapVM` contracts**, it is **recommended** to use the specialized [`AquaProgramBuilder`](./src/swap-vm/programs/aqua-program-builder.ts) instead of the bare `ProgramBuilder`:

- It is pre-wired with `aquaInstructions`, so you **cannot accidentally use opcodes that are not supported by Aqua**.
- It exposes a rich set of **high-level, typed methods** for the Aqua instruction set
💡 **Practical guidance**:

- Use **`AquaProgramBuilder`** for real-world strategy building on current Aqua deployments – it gives you a safer, higher-level API over the Aqua opcode subset.
- Use **`ProgramBuilder`** when:
  - Targeting future full `SwapVM` deployments (post-`Fusaka` on Ethereum), or
  - Working with your own custom instruction sets and contracts.

## Strategies

A **strategy** is a reusable template that produces a `SwapVmProgram` – a sequence of instructions that defines **how** liquidity behaves and **how** swaps should be executed.

At a high level:

- You parameterize a strategy with **business-level inputs** (tokens, fees, decay periods, etc.).
- The strategy’s `.build()` method compiles these into a low-level `SwapVmProgram` using a program builder.
- That program is then embedded into an `Order` and shipped.

### How strategies are built

Strategies are thin wrappers around a program builder:

1. **Collect inputs** (e.g. tokens, fee bps, decay parameters, protocol fee receiver).
2. **Instantiate a builder**:
   - `AquaProgramBuilder` for current `AquaSwapVM` deployments (recommended).
   - `ProgramBuilder` with a custom opcode set for non-Aqua/custom deployments.
3. **Append instructions** in the desired execution order.
4. Call `.build()` to get a `SwapVmProgram`.

Because the strategy owns the builder, you can keep the strategy API stable even if the underlying instruction sequence evolves.

### Creating your own strategy

To define a custom strategy:

1. Create a small builder class that:
   - Stores your **domain parameters** (tokens, price bands, risk limits, etc.).
   - Offers fluent `withX(...)` methods to configure them.
2. In `.build()`:
   - Create `ProgramBuilder`.
   - Append instructions in the order you want them executed.
   - Return `builder.build()`.

This pattern keeps your **business logic readable** at the strategy layer while leveraging the full flexibility of the underlying Swap VM instruction set.

For example:

```typescript
import type { SwapVmProgram } from '@1inch/swap-vm-sdk'
import { AquaProgramBuilder, instructions, Address, Order, MakerTraits } from '@1inch/swap-vm-sdk'
const { concentrate, fee } = instructions

/**
 * Minimal strategy:
 * - concentrates liquidity for a 2-token pool
 * - optionally charges a taker fee on input
 * - always finishes with a simple XYC swap
 */
export class SimpleAmmStrategy {
  private liquidityA?: bigint

  private liquidityB?: bigint

  private feeBpsIn?: number

  constructor(
    public readonly tokenA: Address,
    public readonly tokenB: Address,
  ) {}

  /**
   * Sets initial virtual liquidity for the pair.
   */
  public withLiquidity(a: bigint, b: bigint): this {
    this.liquidityA = a
    this.liquidityB = b

    return this
  }

  /**
   * Sets taker fee (bps) applied to amountIn.
   * If not called, no taker fee is applied.
   */
  public withFeeTokenIn(bps: number): this {
    this.feeBpsIn = bps

    return this
  }

  /**
   * Builds a SwapVmProgram for AquaSwapVM using a small, fixed instruction pipeline:
   *   [concentrate liquidity] -> [optional fee on input] -> [XYC swap]
   */
  public build(): SwapVmProgram {
    const builder = new AquaProgramBuilder()

    if (this.liquidityA !== undefined && this.liquidityB !== undefined) {
      const data = concentrate.ConcentrateGrowLiquidity2DArgs.fromTokenDeltas(
        this.tokenA,
        this.tokenB,
        this.liquidityA,
        this.liquidityB,
      )
      builder.add(concentrate.concentrateGrowLiquidity2D.createIx(data))
    }

    if (this.feeBpsIn !== undefined) {
      const feeArgs = fee.FlatFeeArgs.fromBps(this.feeBpsIn)
      builder.add(fee.flatFeeAmountInXD.createIx(feeArgs))
    }

    // Core swap step
    builder.xycSwapXD()

    return builder.build()
  }
}

// Example usage:

const strategy = new SimpleAmmStrategy(USDC, WETH)
  .withLiquidity(
    10_000n * 10n ** 6n, // 10k USDC
    5n * 10n ** 18n, // 5 WETH
  )
  .withFeeTokenIn(5) // 5 bps taker fee on input (optional)

const program = strategy.build()

const order = Order.new({
  maker: new Address(maker),
  program,
  traits: MakerTraits.default(),
})
```

## Creating your own instructions

You can define your own high-level instructions as long as they:

- Have an on-chain implementation at a specific opcode index.
- Provide a **TypeScript args type**, a **coder**, and an **`Opcode` definition** wired into an instruction set.

Here is an example of implementation `flatFeeXD` instruction. You can implement any custom instruction in the same way.

### 1. Define args class (`FlatFeeArgs`)

```typescript
const FEE_100_PERCENT = 1e9 // 1e9 = 100%

/**
 * Arguments for flat fee instruction
 */
export class FlatFeeArgs implements IArgsData {
  public static readonly CODER = new FlatFeeArgsCoder()

  constructor(public readonly fee: bigint) {
    assert(fee >= 0n && fee <= UINT_32_MAX, `Invalid fee: ${fee}. Must be a valid uint32`)
    assert(
      fee <= BigInt(FEE_100_PERCENT),
      `Fee out of range: ${fee}. Must be <= ${FEE_100_PERCENT}`,
    )
  }

  /**
   * Creates a FlatFeeArgs instance from basis points
   * @param bps - Fee in basis points (10000 bps = 100%)
   */
  public static fromBps(bps: number): FlatFeeArgs {
    const fee = BigInt(bps * 100000)

    return new FlatFeeArgs(fee)
  }
}
```

### 2. Implement an args coder (`FlatFeeArgsCoder`)

Coders:
- Implement `IArgsCoder<T>`.
- Are responsible for **binary layout** of arguments.
- Must be strictly symmetric: `decode(encode(args)) === args`.

```typescript
export class FlatFeeArgsCoder implements IArgsCoder<FlatFeeArgs> {
  encode(args: FlatFeeArgs): HexString {
    const builder = new BytesBuilder()
    builder.addUint32(args.fee)

    return new HexString(add0x(builder.asHex()))
  }

  decode(data: HexString): FlatFeeArgs {
    const iter = BytesIter.BigInt(data.toString())
    const fee = iter.nextUint32()

    return new FlatFeeArgs(fee)
  }
}
```

### 3. Declare the opcode (`flatFeeXD`)

An `Opcode` ties together:
- A **unique identifier** (`Symbol`) for this instruction.
- The **args coder** to use for encoding/decoding.

```typescript
/**
 * Applies flat fee to computed swap amount (same rate for exactIn and exactOut)
 */
export const flatFeeXD = new Opcode(Symbol('Fee.flatFeeXD'), FlatFeeArgs.CODER)
```
Once you have an `Opcode`:

- `flatFeeXD.createIx(args)` produces a typed instruction.
- `ProgramBuilder` can add it to a program:
  - `builder.add(flatFeeXD.createIx(FlatFeeArgs.fromBps(5)))`.

### 4. Wire the opcode into an instruction set
To make your instruction **usable at runtime**, you must place it at the correct index in an instruction set that matches your on-chain VM:

```typescript
export const myInstructionSet: Opcode<IArgsData>[] = [
  /* ... previous opcodes ... */
  fee.flatFeeXD,
  /* ... */
]
```

⚠️ The **array index** in the instruction set (`ixsSet[index]`) must match the **opcode index used by your on-chain contract**. A mismatch will not fail at encoding time but will execute the **wrong instruction** at runtime.

## Supported Networks

The SDK includes pre-configured contract addresses of `AquaSwapVMRouter` for the following networks:

| Network | Chain ID | Address |
|---------|----------|---------|
| Ethereum | 1 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://etherscan.io/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| BNB Chain | 56 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://bscscan.com/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| Polygon | 137 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://polygonscan.com/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| Arbitrum | 42161 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://arbiscan.io/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| Avalanche | 43114 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](http://snowscan.xyz/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| Gnosis | 100 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://gnosisscan.io/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| Coinbase Base | 8453 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://basescan.org/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| Optimism | 10 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://optimistic.etherscan.io/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| zkSync Era | 324 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://era.zksync.network/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| Linea | 59144 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://lineascan.build/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| Unichain | 1301 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://uniscan.xyz/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |
| Sonic | 146 | [0x8fdd04dbf6111437b44bbca99c28882434e0958f](https://sonicscan.org/address/0x8fdd04dbf6111437b44bbca99c28882434e0958f) |

Access addresses using:

```typescript
import { AQUA_SWAP_VM_CONTRACT_ADDRESSES, NetworkEnum } from '@1inch/swap-vm-sdk'

const ethereumAddress = AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ETHEREUM]
const arbitrumAddress = AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ARBITRUM]
```

## API Reference

### Exports

The SDK exports:

- **[`SwapVMContract`](./src/swap-vm-contract/swap-vm-contract.ts)** - Main contract class for encoding, decoding, and building transactions
- **[`AQUA_SWAP_VM_CONTRACT_ADDRESSES`](./src/swap-vm-contract/constants.ts)** - Pre-configured contract addresses by network
- **[`SwappedEvent`](./src/swap-vm-contract/events/swapped-event.ts)** - Event class for parsing swapped events
- **[`Order`](./src/swap-vm/order.ts)** - Order data structure
- **[`MakerTraits`](./src/swap-vm/maker-traits.ts)** - Maker-side configuration and flags
- **[`TakerTraits`](./src/swap-vm/taker-traits.ts)** - Taker-side configuration and flags
- **[`ABI`](./src/abi/)** - Contract ABI exports
- **[Instructions](./src/swap-vm/instructions/)** - Comprehensive instruction system:
  - `controls` - Flow control instructions
  - `balances` - Balance manipulation instructions
  - `invalidators` - Invalidation instructions
  - `xycSwap` - XYC swap instructions
  - `concentrate` - Liquidity concentration instructions
  - `decay` - Decay calculation instructions
  - `limitSwap` - Limit order instructions
  - `minRate` - Minimum rate guard instructions
  - `dutchAuction` - Dutch auction instructions
  - `oraclePriceAdjuster` - Oracle-based price adjustment
  - `baseFeeAdjuster` - Base fee adjustment
  - `twapSwap` - Time-weighted average price instructions
  - `extruction` - External instruction call
  - `fee` - Fee calculation instructions


## License

This SDK is provided under the terms described in [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES).

For any licensing questions or requests, contact:
- license@degensoft.com
- legal@degensoft.com
