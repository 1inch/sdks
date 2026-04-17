# PriceRange

Valid **min / spot / max** band for one pair (`Price` = `sqrt(P)*1e18` + token0/token1). Uses `computeLiquidityFromAmounts` / `computeLiquidityAndPrice` from `concentrate-liquidity-math`. `toJSON` / `fromJSON` use decimal **strings** for bigints.

**Rules**

- token0 = lower address, token1 = higher (same as `Price`, on-chain Lt/Gt).
- Bounds compare by **`sqrtP`**, not by human quote size (e.g. USDC-per-WETH can be non-monotone in sqrt).
- `PriceRange.new` fixes mislabeled min/max vs spot so spot lies between sqrt-min and sqrt-max.

## Types (summary)

| Name | Role |
|------|------|
| `PriceAllocationRange` | `{ minPrice, spotPrice, maxPrice }` — three `Price` (same pair). |
| `PriceBounds` | `{ minPrice, maxPrice }` — for `fromPriceBounds` only. |
| `TokenReserves` | `{ reserveA, reserveB }` — `TokenReserve` each; A/B order can swap vs token0/1. |
| `SortedReserves` | `{ reserve0, reserve1 }` — pool order after allocation. |
| `PriceRangeJSON` | Snapshot of three `Price` JSON legs (strings for sqrt/decimals). |

## Methods

| Method | Purpose |
|--------|---------|
| `PriceRange.new(range)` | Normalize bounds + validate spot ∈ [min,max] in sqrt space. |
| `PriceRange.fromJSON(json)` | Deserialize `PriceRangeJSON`. |
| `PriceRange.fromPriceBounds(bounds, reserves)` | Implied spot from balances + bounds (`computeLiquidityAndPrice`). |
| `computeMaxAllocation({ reserveA, reserveB })` | Max **L** using both caps. |
| `computeFixedAllocation(fixedReserve)` | One token amount fixed; other side unconstrained (`UINT_256_MAX` internally). |
| `toJSON()` | Persist-friendly JSON. |
| `token0` / `token1` | `PriceToken` metadata for the pair. |

---

### Max allocation

```ts
const pair = {
  quoteToken: { address: usdc, decimals: 6n },
  baseToken: { address: weth, decimals: 18n },
}

const range = PriceRange.new({
  minPrice: Price.fromHuman('2000', pair),
  spotPrice: Price.fromHuman('2500', pair),
  maxPrice: Price.fromHuman('3000', pair),
})

const max = range.computeMaxAllocation({
  reserveA: TokenReserve.new({ token: usdc, reserve: parseUnits('1000000', 6) }),
  reserveB: TokenReserve.new({ token: weth, reserve: parseUnits('400', 18) }),
})
// max.reserve0 / max.reserve1 — TokenReserve, token0 / token1 order
```

### Fixed allocation

Fix **exactly one** token amount (e.g. “deposit 1 WETH”); the other leg is computed for the same liquidity **L** (integer math may shave a few wei off the fixed side).

```ts
const range = PriceRange.new({
  minPrice: Price.fromHuman('2000', pair),
  spotPrice: Price.fromHuman('2500', pair),
  maxPrice: Price.fromHuman('3000', pair),
})

const fixedWeth = TokenReserve.new({
  token: weth,
  reserve: parseUnits('1', 18),
})

const out = range.computeFixedAllocation(fixedWeth)
// out.reserve0 — USDC amount needed (if token0 is USDC)
// out.reserve1 — WETH amount (≈ 1e18, may differ by dust)
```

### Spot from balances

```ts
const range = PriceRange.fromPriceBounds(
  { minPrice: pMin, maxPrice: pMax },
  {
    reserveA: TokenReserve.new({ token: usdc, reserve: balUsdc }),
    reserveB: TokenReserve.new({ token: weth, reserve: balWeth }),
  },
)

const sqrtSpot = range.spotPrice.toSqrt() // 1e18 fixed-point
```
