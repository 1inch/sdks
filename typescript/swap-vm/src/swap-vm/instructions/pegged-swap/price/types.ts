// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

export type PeggedTokenRef = {
  address: Address
  decimals: number
}

export type PeggedPricePair = {
  quoteToken: PeggedTokenRef
  baseToken: PeggedTokenRef
}

export type PeggedTokenReserve = PeggedTokenRef & {
  initialReserve: bigint
  currentReserve: bigint
}

export type PeggedReservesInput = {
  reserveA: PeggedTokenReserve
  reserveB: PeggedTokenReserve
  linearWidth: bigint
}

/**
 * Snapshot from `PeggedPrice.prototype.toJSON` (bigints as decimal strings).
 * The price is `numerator / denominator` raw tokenGt units per raw tokenLt unit, in lowest terms.
 */
export type PeggedPriceJSON = {
  numerator: string
  denominator: string
  tokenLt: { address: string; decimals: string }
  tokenGt: { address: string; decimals: string }
}

/**
 * Snapshot written by earlier SDK versions, still accepted by `PeggedPrice.fromJSON`.
 * `gtPerLtRaw` is the raw tokenGt-per-tokenLt rate scaled by 10^(tokenLt decimals + tokenGt decimals).
 */
export type PeggedPriceLegacyJSON = {
  gtPerLtRaw: string
  tokenLt: { address: string; decimals: string }
  tokenGt: { address: string; decimals: string }
}
