# ConcentrateLiquidityCalculator

Calculator for concentrated liquidity positions: given two tokens and a price range (min, spot, max), it computes sqrt prices and token reserves for use with the SwapVM concentrated liquidity instructions (e.g. `ConcentrateGrowLiquidity2D`). It can also derive the **implied spot** `sqrt(P_spot)` from raw token0/token1 balances and **min/max** price bounds only (`computeSpotPrice`).

## Overview

- **Token ordering**: Pool convention is token0 = lower address, token1 = higher address. The calculator derives token0/token1 from the two tokens you pass (order of tokenA/tokenB does not matter).
- **Price convention**: User prices are expressed as “quote token per 1 unit of the other token”, scaled by `10^(token0Decimals + token1Decimals)` (`priceRaw = humanPrice * 10^(token0Decimals + token1Decimals)`). The calculator converts these to internal P = token1/token0 in 1e18 and then to sqrt(P * 1e18) for the underlying math.
- **Allocation modes**:
  - **Max allocation**: Use all available balances (from `ConcentrateTokenInfo.maxAvailableLiquidity`) to maximize liquidity L.
  - **Fixed allocation**: Fix the amount of one token; the other token amount is computed so that the position has the same L.
- **Inverse (spot from balances)**: Given raw token0/token1 balances and only the price **bounds** (min/max, same scaling as below), `computeSpotPrice` returns the implied spot as `sqrt(P_spot)` in 1e18 fixed-point. This matches the inverse math used in `concentrate-liquidity-math` (`computeLiquidityAndPrice`); it does not return liquidity.

## Types

### `ConcentrateTokenInfo`

Per-token input:

| Field | Type | Description |
|-------|------|-------------|
| `address` | `Address` | Token contract address (used for ordering and matching). |
| `decimals` | `bigint` | Token decimals (e.g. 18n, 6n). |
| `maxAvailableLiquidity` | `bigint` | Maximum raw amount the user is willing to allocate. Only used by `computeMaxAllocation`. |

### `ScaledPrices`

Price range in “raw” form. Each price is **quote token per 1 unit of the other token**, scaled by `10^(token0Decimals + token1Decimals)` (e.g. for USDC/WETH: `10^24`).

| Field | Type | Description |
|-------|------|-------------|
| `quoteToken` | `Address` | Token in which prices are quoted (must be one of the two calculator tokens). |
| `minPriceRaw` | `bigint` | Left (lowest) price bound, raw. |
| `spotPriceRaw` | `bigint` | Current spot price, raw. |
| `maxPriceRaw` | `bigint` | Right (highest) price bound, raw. |

Constraint: `minPriceRaw < spotPriceRaw < maxPriceRaw`.

### `ScaledPriceBounds`

Same fields and scaling as `ScaledPrices`, but **only** `quoteToken`, `minPriceRaw`, and `maxPriceRaw` (no spot). Used by `computeSpotPrice`.

Constraint: `minPriceRaw < maxPriceRaw` (in quote-token terms, consistent with `ScaledPrices`).

### `ConcentratedLiquidityInfo`

Result of an allocation: sqrt prices in 1e18 and reserves in raw token amounts.

| Field | Type | Description                      |
|-------|------|----------------------------------|
| `sqrtPriceMin` | `bigint` | sqrt(P_min * 1e18).              |
| `sqrtPriceSpot` | `bigint` | sqrt(P_spot * 1e18).             |
| `sqrtPriceMax` | `bigint` | sqrt(P_max * 1e18).            |
| `token0Reserve` | `bigint` | Raw amount of token0 to deposit. |
| `token1Reserve` | `bigint` | Raw amount of token1 to deposit. |

### `ConcentrateLiquidityCalculatorArgs`

Constructor/factory input: the two tokens. Order is arbitrary.

| Field | Type |
|-------|------|
| `tokenA` | `ConcentrateTokenInfo` |
| `tokenB` | `ConcentrateTokenInfo` |

## API

The calculator and its types are exported on `instructions.concentrate` from `@1inch/swap-vm-sdk` (same pattern as the package README).

```ts
import { instructions } from '@1inch/swap-vm-sdk'
import { parseUnits } from 'viem'

const { ConcentrateLiquidityCalculator } = instructions.concentrate
```

### Creating a calculator

```ts
const calculator = ConcentrateLiquidityCalculator.new({
  tokenA: { address: usdcAddress, decimals: 6n, maxAvailableLiquidity: parseUnits('1000000', 6) },
  tokenB: { address: wethAddress, decimals: 18n, maxAvailableLiquidity: parseUnits('400', 18) },
})

// token0 = lower address, token1 = higher address
calculator.token0  // ConcentrateTokenInfo
calculator.token1  // ConcentrateTokenInfo
```

### `computeMaxAllocation(scaledPrices)`

Uses `token0.maxAvailableLiquidity` and `token1.maxAvailableLiquidity` to maximize L over the given range. Returns sqrt prices and the token0/token1 reserves that achieve that maximum.

**Use case**: “Deposit all my available USDC and WETH into this range.”

```ts
// multiplier = 10^(token0Decimals + token1Decimals), e.g. 10^24 for USDC(6)/WETH(18)
const PRICE_MULTIPLIER = 10n ** (6n + 18n)
const prices = {
  quoteToken: wethAddress,
  minPriceRaw: parseUnits('0.0003', 18 + 6),   // left bound
  spotPriceRaw: parseUnits('0.0004', 18 + 6),  // spot
  maxPriceRaw: parseUnits('0.0005', 18 + 6),   // right bound
}

const result = calculator.computeMaxAllocation(prices)
// result.sqrtPriceMin, result.sqrtPriceSpot, result.sqrtPriceMax (1e18)
// result.token0Reserve, result.token1Reserve (raw amounts)
```

### `computeFixedAllocation(scaledPrices, fixedReserveForToken, fixedReserve)`

Fixes the amount of one token to `fixedReserve` and computes the required amount of the other token so that the position has the same liquidity L. Returns the same shape as `computeMaxAllocation`.

**Precision**: Due to integer math (floor division, sqrt), the fixed asset amount in the result may be less than requested by a few wei.

**Use case**: “I want to deposit exactly 1 WETH; how much USDC do I need?”

```ts
const result = calculator.computeFixedAllocation(
  prices,
  wethAddress,
  parseUnits('1', 18),
)
// result.token0Reserve, result.token1Reserve are the two amounts to use
```

### `computeSpotPrice(token0Balance, token1Balance, scaledPriceBounds)`

Takes **raw** amounts of token0 and token1 (pool order: lower address = token0) and a **`ScaledPriceBounds`** range. Converts the bounds the same way as allocation methods, then computes the **implied** spot `sqrt(P_spot)` in **1e18** fixed-point (same units as `ConcentratedLiquidityInfo.sqrtPriceSpot`).

```ts
const bounds = {
  quoteToken: wethAddress,
  minPriceRaw: parseUnits('0.0003', 18 + 6),
  maxPriceRaw: parseUnits('0.0005', 18 + 6),
}

const sqrtPriceSpot = calculator.computeSpotPrice(
  token0BalanceRaw,
  token1BalanceRaw,
  bounds,
)
// sqrtPriceSpot: bigint — sqrt(P_spot * 1e18), same units as ConcentratedLiquidityInfo.sqrtPriceSpot
```

## Price scaling

- User-facing prices are **quote token per 1 of the other token**, scaled by **`10^(token0Decimals + token1Decimals)`**: `priceRaw = humanPrice * 10^(token0Decimals + token1Decimals)`.
- For a USDC (6 decimals) / WETH (18 decimals) pair the multiplier is `10^24`.
- Example: “2000 USDC per 1 WETH” with USDC as quote → `minPriceRaw = 2000 * 10^24`.
- Example: “0.0005 WETH per 1 USDC” with WETH as quote → `spotPriceRaw = 0.0005 * 10^24 = 5e20`.

The calculator accepts either token as `quoteToken` and converts internally to P = token1/token0, then to sqrt(P * 1e18) for the concentrated liquidity math.

## Relation to SwapVM

The returned `ConcentratedLiquidityInfo` (sqrtPriceMin, sqrtPriceSpot, sqrtPriceMax, token0Reserve, token1Reserve) is designed to be mapped onto the arguments expected by the SwapVM concentrated liquidity instructions (e.g. `ConcentrateGrowLiquidity2DArgs` and the corresponding coders). token0/token1 here correspond to the pool’s Lt/Gt (lower/higher address) ordering used in the contract.
