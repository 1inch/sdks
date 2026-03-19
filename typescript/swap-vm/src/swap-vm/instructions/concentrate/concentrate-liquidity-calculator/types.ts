// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

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
 * Price range in "raw" form: each price is in units of quote-token raw amount per
 * one unit of the other token (scaled by 10^decimals of the quote token).
 * minPrice < spotPrice < maxPrice (left to right on the price axis).
 */
export type ScaledPrices = {
  quoteToken: Address
  minPriceRaw: bigint
  spotPriceRaw: bigint
  maxPriceRaw: bigint
}

/**
 * Result of allocation: sqrt prices and the token0/token1 reserves
 * (raw amounts) to use for the concentrated liquidity position.
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
