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

export type PriceAllocationRange = {
  minPrice: Price
  spotPrice: Price
  maxPrice: Price
}

export type PriceBounds = {
  minPrice: Price
  maxPrice: Price
}

export type ConcentratedLiquidityInfo = {
  token0Reserve: bigint
  token1Reserve: bigint
}

/**
 * Result of a single-sided range calculation: the price range with the spot sitting
 * exactly on one bound, and the reserves with the opposite (depleted) side at zero.
 */
export type SingleSidedRangeInfo = {
  prices: PriceAllocationRange
  reserves: ConcentratedLiquidityInfo
}

/**
 * Constructor argument: the two tokens (tokenA, tokenB). Order is arbitrary;
 * token0/token1 are derived by address comparison.
 */
export type ConcentrateLiquidityCalculatorArgs = {
  tokenA: ConcentrateTokenInfo
  tokenB: ConcentrateTokenInfo
}
