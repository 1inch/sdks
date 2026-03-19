// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

export type ConcentrateTokenInfo = {
  address: Address
  decimals: bigint
  maxAvailableLiquidity: bigint
}

export type ScaledPrices = {
  quoteToken: Address
  minPriceRaw: bigint
  spotPriceRaw: bigint
  maxPriceRaw: bigint
}

export type ConcentratedLiquidityInfo = {
  sqrtPriceMin: bigint
  sqrtPriceSpot: bigint
  sqrtPriceMax: bigint
  token0Reserve: bigint
  token1Reserve: bigint
}

export type ConcentrateLiquidityCalculatorArgs = {
  tokenA: ConcentrateTokenInfo
  tokenB: ConcentrateTokenInfo
}
