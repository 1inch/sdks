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
 * Constructor argument: the two tokens (tokenA, tokenB). Order is arbitrary;
 * token0/token1 are derived by address comparison.
 */
export type ConcentrateLiquidityCalculatorArgs = {
  tokenA: ConcentrateTokenInfo
  tokenB: ConcentrateTokenInfo
}
