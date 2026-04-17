# PriceRange

A validated **min / spot / max** price band for a single pair, built from the shared `Price` type (`sqrt(P * 1e18)` plus canonical token0/token1). It powers **liquidity allocation** (max or fixed side) via `concentrate-liquidity-math`, and can **infer spot** from raw balances and price bounds (`fromPriceBounds`, same inverse math as `computeLiquidityAndPrice`). JSON snapshots use **decimal strings** for bigints (`PriceRangeJSON`).

## Overview

- **Token ordering**: token0 = lower address, token1 = higher address (same as `Price` and on-chain Lt/Gt).
- **Comparisons are in sqrt space**: `minPrice`, `spotPrice`, and `maxPrice` are ordered by `sqrtP`, not by arbitrary “human” quote strings. For some pairs (e.g. USDC-per-WETH with USDC as quote), **higher human quote can mean lower `sqrtP`**; use `Price.fromHuman` / `Price` comparisons rather than sorting raw strings.
- **Factory `PriceRange.new`**: Accepts three `Price` instances that may be **mislabeled** as min/max relative to spot; it picks the sqrt-lower and sqrt-upper bound around the given spot before constructing the range.
- **Allocations**: `computeMaxAllocation` and `computeFixedAllocation` return **`SortedReserves`** (`TokenReserve` for token0 and token1), aligned with pool order.
- **Spot from balances**: `fromPriceBounds` maps `reserveA` / `reserveB` to token0/token1 (either order), runs `computeLiquidityAndPrice`, and builds a full `PriceRange` including implied spot.

## Types

### `PriceAllocationRange`

Input to `PriceRange.new` / `fromJSON`: three `Price` values for the same pair.

| Field | Type | Description |
|-------|------|-------------|
| `minPrice` | `Price` | Lower or upper **label**; normalized by `new` using sqrt order vs `spotPrice`. |
| `spotPrice` | `Price` | Current price; must lie between the normalized min and max in sqrt space. |
| `maxPrice` | `Price` | Complement bound to `minPrice`; same normalization as above. |

### `PriceBounds`

Only **min** and **max** prices (no spot). Used by `fromPriceBounds`. If the two fields are swapped relative to sqrt order, they are normalized the same way as in `fromPriceBounds`’s internal min/max.

| Field | Type | Description |
|-------|------|-------------|
| `minPrice` | `Price` | One price bound. |
| `maxPrice` | `Price` | The other bound (sqrt order is fixed internally). |

### `TokenReserves`

Two-sided amounts with **arbitrary A/B order**; must correspond to the pair’s token0/token1 (see `fromPriceBounds` / `computeMaxAllocation`).

| Field | Type | Description |
|-------|------|-------------|
| `reserveA` | `TokenReserve` | One token’s max or actual reserve. |
| `reserveB` | `TokenReserve` | The other token’s reserve. |

### `SortedReserves`

Output of allocation methods: **token0 / token1** pool order.

| Field | Type | Description |
|-------|------|-------------|
| `reserve0` | `TokenReserve` | Amount for token0 (lower address). |
| `reserve1` | `TokenReserve` | Amount for token1 (higher address). |

### `PriceRangeJSON`

Serializable snapshot from `toJSON` / input to `fromJSON`. Bigints from `Price` appear as **decimal strings** (`sqrtP`, decimals fields).

## API

`PriceRange` and `PriceRangeJSON` are exported from `instructions.concentrate` in `@1inch/swap-vm-sdk` (see package README). Related types (`PriceAllocationRange`, `PriceBounds`, `TokenReserves`, `SortedReserves`) live in the same module; import from the SDK’s concentrate entry or from the `price-range` path depending on your setup.

```ts
import { instructions } from '@1inch/swap-vm-sdk'
import { parseUnits } from 'viem'

const { Price, PriceRange, TokenReserve } = instructions.concentrate
```

### `PriceRange.new(range: PriceAllocationRange)`

Builds a range with **spot between min and max in sqrt order**. If the caller’s `minPrice` / `maxPrice` labels are swapped relative to spot, they are corrected.

### `PriceRange.fromJSON(input: PriceRangeJSON)`

Deserializes JSON produced by `toJSON()` (each `Price` must have canonical token0 address less than token1).

### `PriceRange.fromPriceBounds(bounds: PriceBounds, reserves: TokenReserves)`

Computes implied **spot** `sqrt(P_spot)` from `computeLiquidityAndPrice(reserve0, reserve1, sqrtMin, sqrtMax)` and returns `PriceRange.new({ minPrice, spotPrice, maxPrice })`. Reserves must match `bounds.minPrice`’s token0/token1 addresses (see asserts in implementation).

### `computeMaxAllocation(maxAvailableLiquidity: TokenReserves)`

Maximizes liquidity **L** over `[minPrice, maxPrice]` at `spotPrice` using both caps, via `computeLiquidityFromAmounts`. Returns `SortedReserves`.

### `computeFixedAllocation(fixedReserve: TokenReserve)`

Fixes one side’s amount; the other side is `UINT_256_MAX` in the liquidity helper so the same **L** is targeted. Returns `SortedReserves`.

### `toJSON(): PriceRangeJSON`

Bigint-safe JSON for logging or storage.

### Getters `token0` / `token1`

Expose canonical `PriceToken` metadata from the range (from `minPrice`’s pair).

## Example: human prices and a range

```ts
import type { PricePair } from '@1inch/swap-vm-sdk' // or instructions.concentrate types

const pair: PricePair = {
  quoteToken: { address: usdc, decimals: 6n },
  baseToken: { address: weth, decimals: 18n },
}

const minPrice = Price.fromHuman('2000', pair)
const spotPrice = Price.fromHuman('2500', pair)
const maxPrice = Price.fromHuman('3000', pair)

const range = PriceRange.new({ minPrice, spotPrice, maxPrice })

const allocation = range.computeMaxAllocation({
  reserveA: TokenReserve.new({ token: usdc, reserve: parseUnits('1000000', 6) }),
  reserveB: TokenReserve.new({ token: weth, reserve: parseUnits('400', 18) }),
})
// allocation.reserve0 / reserve1 — TokenReserve for token0 / token1
```

## Example: spot from balances

```ts
const bounds = { minPrice: pMin, maxPrice: pMax } // same pair as reserves

const range = PriceRange.fromPriceBounds(bounds, {
  reserveA: TokenReserve.new({ token: token0Addr, reserve: balance0 }),
  reserveB: TokenReserve.new({ token: token1Addr, reserve: balance1 }),
})

const sqrtSpot = range.spotPrice.toSqrt()
```
