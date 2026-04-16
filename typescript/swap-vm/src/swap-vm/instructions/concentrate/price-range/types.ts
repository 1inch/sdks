// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { PriceJSON } from '../price/types'
import type { Price } from '../price'
import type { TokenReserve } from '../token-reserve'

export type PriceAllocationRange = {
  minPrice: Price
  spotPrice: Price
  maxPrice: Price
}

export type PriceBounds = {
  minPrice: Price
  maxPrice: Price
}

export type TokenReserves = {
  reserveA: TokenReserve
  reserveB: TokenReserve
}

/** Snapshot from `PriceRange.prototype.toJSON`. */
export type PriceRangeJSON = {
  minPrice: PriceJSON
  spotPrice: PriceJSON
  maxPrice: PriceJSON
}
