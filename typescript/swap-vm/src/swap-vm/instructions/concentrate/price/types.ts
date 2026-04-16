// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { PricePair } from './refs'

/** Params for `Price.fromSqrt`. */
export type PriceFromSqrtParams = PricePair & {
  /** Fixed-point sqrt price as used on-chain (`sqrt(P * 1e18)` in 1e18 fixed-point). */
  sqrtP: bigint
}

/** Params for `Price.fromHuman`. */
export type PriceFromHumanParams = PricePair & {
  /** Decimal string for **quote per 1 base** at scale `10^(token0Decimals + token1Decimals)`. */
  price: string
}
