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

/** Snapshot from `PeggedPrice.prototype.toJSON` (bigints as decimal strings). */
export type PeggedPriceJSON = {
  gtPerLtRaw: string
  tokenLt: { address: string; decimals: string }
  tokenGt: { address: string; decimals: string }
}
