// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import assert from 'assert'
import { bigintSqrt } from '../../utils'

/** Matches `PeggedSwapMath.ONE` in swap-vm. */
export const PEGGED_SWAP_ONE = 10n ** 27n

const MARGINAL_PRICE_ONE = 10n ** 18n

/**
 * Spot price tokenGt per tokenLt (raw) in 1e18 fixed-point.
 *
 * P = (Y₀/X₀) · (1/(2√u) + A) / (1/(2√v) + A) · (rateLt/rateGt)
 *
 * where u = x·ONE/X₀, v = y·ONE/Y₀, x/y are rate-adjusted Lt/Gt balances, A = `linearWidth`.
 */
export function peggedSwapMarginalGtPerLtE18(
  balanceLtNorm: bigint,
  balanceGtNorm: bigint,
  x0: bigint,
  y0: bigint,
  linearWidth: bigint,
  rateLt: bigint,
  rateGt: bigint,
): bigint {
  const u = normalizeReserve(balanceLtNorm, x0)
  const v = normalizeReserve(balanceGtNorm, y0)

  assert(u !== 0n && v !== 0n, 'PeggedSwapMath: reserves cannot be zero')

  const slopeLt = peggedSwapMarginalWeight(bigintSqrt(u * PEGGED_SWAP_ONE), linearWidth)
  const slopeGt = peggedSwapMarginalWeight(bigintSqrt(v * PEGGED_SWAP_ONE), linearWidth)

  return (y0 * slopeLt * rateLt * MARGINAL_PRICE_ONE) / (x0 * slopeGt * rateGt)
}

/**
 * u = x·ONE/X₀, v = y·ONE/Y₀ (x, y are rate-adjusted reserves).
 */
export function normalizeReserve(currentReserve: bigint, initialReserve: bigint): bigint {
  return mulDiv(currentReserve, PEGGED_SWAP_ONE, initialReserve)
}

/**
 * Marginal weight `1/(2√u) + A` (Lt side) or `1/(2√v) + A` (Gt side), A = `linearWidth`.
 */
export function peggedSwapMarginalWeight(sqrtCoord: bigint, linearWidth: bigint): bigint {
  return mulDiv(PEGGED_SWAP_ONE, PEGGED_SWAP_ONE, 2n * sqrtCoord) + linearWidth
}

function mulDiv(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) {
    throw new Error('mulDiv: division by zero')
  }

  return (a * b) / c
}
