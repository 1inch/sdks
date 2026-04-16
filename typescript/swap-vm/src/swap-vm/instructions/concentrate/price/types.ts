// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

export type PriceToken = {
  address: Address
  decimals: bigint
}

export type PricePair = {
  quoteToken: PriceToken
  baseToken: PriceToken
}

/** Snapshot from `Price.prototype.toJSON` (bigints as decimal strings). */
export type PriceJSON = {
  sqrtP: string
  token0: { address: string; decimals: string }
  token1: { address: string; decimals: string }
}
