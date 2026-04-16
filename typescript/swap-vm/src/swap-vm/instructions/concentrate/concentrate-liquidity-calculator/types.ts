// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import type { Price } from '../price'

/**
 * Per-token input for the calculator: address, decimals, and the maximum amount
 * the user is willing to allocate (used by computeMaxAllocation).
 */
export type ConcentrateTokenInfo = {
  address: Address
  decimals: bigint
  maxAvailableLiquidity: bigint
}

/**
 * Price range using {@link Price} (min / spot / max). Decimals must match the calculator pair.
 * `minPrice` and `maxPrice` are **economic** bounds: the lower and higher human “quote per 1 base”
 * for the same {@link Price} orientation (same quote/base as each other). The calculator maps them
 * to sqrt order internally for liquidity math (so e.g. USDC-per-WETH 2000 vs 3000 need not match
 * sqrt ordering).
 */
export type PriceAllocationRange = {
  minPrice: Price
  spotPrice: Price
  maxPrice: Price
}

/**
 * Price bounds (min / max only) using {@link Price}. Decimals must match the calculator pair.
 * Same **economic** min/max semantics as {@link PriceAllocationRange}.
 */
export type PriceBounds = {
  minPrice: Price
  maxPrice: Price
}

/**
 * Result of allocation: sqrt prices and the token0/token1 reserves
 * (smallest-unit amounts) to use for the concentrated liquidity position.
 */
export type ConcentratedLiquidityInfo = {
  sqrtPriceMin: bigint
  sqrtPriceSpot: bigint
  sqrtPriceMax: bigint
  token0Reserve: bigint
  token1Reserve: bigint
}

/**
 * Constructor argument: the two tokens (tokenA, tokenB). Order is arbitrary;
 * token0/token1 are derived by address comparison.
 */
export type ConcentrateLiquidityCalculatorArgs = {
  tokenA: ConcentrateTokenInfo
  tokenB: ConcentrateTokenInfo
}
