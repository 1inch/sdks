// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

export type PeggedTokenInfo = { address: Address; decimals: number; reserve: bigint }

export type PeggedArgs = {
  tokenA: PeggedTokenInfo
  tokenB: PeggedTokenInfo
  linearWidth: bigint
}

export type ConcentrateSqrtPrices = {
  sqrtPriceMin: bigint
  sqrtPriceMax: bigint
}

/*
 * Each price scaled by 1e18
 * The price determined as P = tokenGt/tokenLt
 * E.g., range:
 *   priceMin: 1500.23 USDC per WETH
 *   priceMax: 3000.11 USDC per WETH
 *
 * BigInt(WETH) > BigInt(USDC), so
 * rawPriceMin = (1n * 10n ** BigInt(USDC_DECIMALS)) * 10n ** 18n / parseUnits('3000.11', USDC_DECIMALS)
 * rawPriceMax = (1n * 10n ** BigInt(USDC_DECIMALS)) * 10n ** 18n / parseUnits('1500.23', USDC_DECIMALS)
 */
export type ConcentrateRawPrices = {
  rawPriceMin: bigint
  rawPriceMax: bigint
}
