// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'

/**
 * A token in a pair: contract address and decimals.
 */
export type PriceTokenRef = {
  address: Address
  decimals: bigint
}

/**
 * Quote and base legs for `Price` (scaled values are “quote per 1 base”).
 */
export type PricePair = {
  quoteToken: PriceTokenRef
  baseToken: PriceTokenRef
}
