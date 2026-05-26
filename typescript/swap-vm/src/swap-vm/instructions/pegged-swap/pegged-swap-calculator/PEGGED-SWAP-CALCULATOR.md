# PeggedSwapCalculator

Helper for **initial pool balances before deployment** of a PeggedSwap strategy (`peggedSwapGrowPriceRange2D`). It answers: “I know the target spot price and how much of one token I want to deposit — how much of the other token do I need so the pool starts on-peg?”

This calculator only covers the **pre-launch** case where `currentReserve = initialReserve` (normalized coordinates `u = v = 1` on the curve). It does not model reserves after trading or off-center spot.

## Overview

- **Token ordering**: Lt = lower address, Gt = higher address (same as on-chain `PeggedSwapMath`). `tokenA` / `tokenB` order in the constructor does not matter; use `tokenLt` / `tokenGt` getters if needed.
- **Price convention**: Use `PeggedPrice` — human string is **quote per 1 base** (same as `Price` in concentrate). Internally the marginal rate is **tokenGt per tokenLt** in 1e18 fixed-point.
- **At deployment center**: Spot does not depend on `linearWidth`; with equal normalization, `reserveGt ≈ reserveLt × spot` (in raw units, via `toGtPerLtE18()`). `linearWidth` still goes into `PeggedSwapArgs` and affects swaps after launch.

## On-chain curve (context)

PeggedSwap invariant (see [PeggedSwap.sol](https://github.com/1inch/swap-vm/blob/main/src/instructions/PeggedSwap.sol)):

```
√(x/X₀) + √(y/Y₀) + A(x/X₀ + y/Y₀) = 1 + A
```

`X₀` / `Y₀` in args are **rate-scaled** initial balances: `x0 = initialLt × rateLt`, `y0 = initialGt × rateGt` (see `PeggedSwapArgs.fromTokens`).

## Types

### `PeggedSwapCalculatorArgs`

| Field | Type | Description |
|-------|------|-------------|
| `tokenA` | `PeggedTokenRef` | First token (`address`, `decimals`). |
| `tokenB` | `PeggedTokenRef` | Second token. |

### `PeggedInitialBalances`

| Field | Type | Description |
|-------|------|-------------|
| `reserveLt` | `bigint` | Raw initial balance for Lt (lower address). |
| `reserveGt` | `bigint` | Raw initial balance for Gt (higher address). |

## API

Exported from `instructions.peggedSwap` on `@1inch/swap-vm-sdk`:

```ts
import { instructions } from '@1inch/swap-vm-sdk'
import { parseUnits } from 'viem'

const { PeggedSwapCalculator, PeggedPrice, PeggedSwapArgs } = instructions.peggedSwap
```

### Creating a calculator

```ts
const USDC = { address: usdcAddress, decimals: 6 }
const USDT = { address: usdtAddress, decimals: 6 }

const calculator = PeggedSwapCalculator.new({ tokenA: USDC, tokenB: USDT })
// calculator.tokenLt → USDC (lower address)
// calculator.tokenGt → USDT
```

### `computeFixedAllocation(spotPrice, fixedReserveForToken, fixedReserve)`

Given a target **`PeggedPrice`** and a **raw** amount for one token, returns both initial reserves in Lt/Gt order.

**Use case**: “Deposit 1M USDC; how much USDT at 0.998 USDT/USDC before the strategy ships?”

```ts
const spot = PeggedPrice.fromHuman('0.998', {
  quoteToken: { address: usdtAddress, decimals: 6 },
  baseToken: { address: usdcAddress, decimals: 6 },
})

const fixedUsdc = parseUnits('1000000', 6)
const balances = calculator.computeFixedAllocation(spot, usdcAddress, fixedUsdc)

// balances.reserveLt — USDC amount (raw)
// balances.reserveGt — USDT amount (raw)
```

Fix the other side instead:

```ts
const balances = calculator.computeFixedAllocation(spot, usdtAddress, parseUnits('998000', 6))
```

### Building `PeggedSwapArgs`

Pass the computed raw reserves into `PeggedSwapArgs.fromTokens` (rates and Lt/Gt ordering are applied inside):

```ts
const linearWidth = 8n * 10n ** 26n // A = 0.8

const args = PeggedSwapArgs.fromTokens(
  { address: usdcAddress, decimals: 6, reserve: balances.reserveLt },
  { address: usdtAddress, decimals: 6, reserve: balances.reserveGt },
  linearWidth,
)
```

Use `args` with `peggedSwapGrowPriceRange2D` in your program builder (e.g. `AquaPeggedAmmStrategy`).

## Spot price helpers (`PeggedPrice`)

The calculator does not compute spot from reserves; use **`PeggedPrice`**:

| Method | Purpose |
|--------|---------|
| `PeggedPrice.fromHuman(price, pair)` | Parse target quote-per-base (e.g. `'0.998'`, `'1.002'`). |
| `PeggedPrice.fromReserves({ reserveA, reserveB, linearWidth })` | Marginal spot from initial/current reserves; set `currentReserve = initialReserve` before launch. |
| `price.toHuman(quoteToken)` | Format for display. |

**Verify** allocation (optional):

```ts
const check = PeggedPrice.fromReserves({
  linearWidth,
  reserveA: { ...usdc, initialReserve: balances.reserveLt, currentReserve: balances.reserveLt },
  reserveB: { ...usdt, initialReserve: balances.reserveGt, currentReserve: balances.reserveGt },
})

expect(check.toHuman(usdtAddress)).toBe('0.998')
```

## Examples

### USDC / USDT @ 0.998

Lt = USDC, Gt = USDT. Quote = USDT, base = USDC → 0.998 USDT per 1 USDC.

1M USDC fixed → 998_000 USDT (6 decimals each).

### DAI / USDC @ 1.002

Lt = DAI (18 dec), Gt = USDC (6 dec). Quote = USDC, base = DAI → 1.002 USDC per 1 DAI.

1M DAI fixed → 1_002_000 USDC (raw `6` decimals).

## Relation to SwapVM

| Piece | Role |
|-------|------|
| `PeggedSwapCalculator` | Initial Lt/Gt raw balances from spot + one fixed leg. |
| `PeggedSwapArgs` | Encoded `x0`, `y0`, `linearWidth`, `rateLt`, `rateGt` for the instruction. |
| `PeggedPrice` | Human and reserve-based marginal price (gt per lt). |

After deployment, spot moves with reserves; use `PeggedPrice.fromReserves` with **current** balances, not this calculator.
