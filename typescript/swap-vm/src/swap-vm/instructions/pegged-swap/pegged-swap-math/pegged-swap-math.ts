// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import assert from 'assert'
import { bigintSqrt } from '../../utils'

/** Matches `PeggedSwapMath.ONE` in swap-vm. */
export const PEGGED_SWAP_ONE: bigint = 10n ** 27n

/** Maximum on-chain `linearWidth` (`A` ≤ 2). */
export const MAX_LINEAR_WIDTH: bigint = 2n * PEGGED_SWAP_ONE

const MARGINAL_PRICE_ONE = 10n ** 18n

const PERCENT_PRECISION = 10n ** 13n
const PERCENT_PRECISION_NUMBER = 1e13

/**
 * On-chain `linearWidth` from symmetric peg-band half-width as a human percent.
 *
 * @param symmetricRangePercent - Half-width in percent (e.g. `0.2` for ±0.20%, `25.5` for ±25.5%).
 *
 * A = (1 − X) / (2X),  X = percent / 100,  `linearWidth` = A · `PEGGED_SWAP_ONE`.
 */
export function linearWidthFromSymmetricRangePercent(symmetricRangePercent: number): bigint {
  assert(
    Number.isFinite(symmetricRangePercent),
    'PeggedSwapMath: symmetric range percent must be a finite number',
  )
  assert(symmetricRangePercent > 0, 'PeggedSwapMath: symmetric range percent must be positive')
  assert(
    symmetricRangePercent < 100,
    'PeggedSwapMath: symmetric range percent must be less than 100%',
  )

  const x = symmetricRangePercentToScaledFraction(symmetricRangePercent)

  const linearWidth = mulDiv(PEGGED_SWAP_ONE - x, PEGGED_SWAP_ONE, 2n * x)

  assert(linearWidth >= 0n, 'PeggedSwapMath: linearWidth must be non-negative')
  assert(
    linearWidth <= MAX_LINEAR_WIDTH,
    `PeggedSwapMath: linearWidth exceeds maximum (${MAX_LINEAR_WIDTH})`,
  )

  return linearWidth
}

/**
 * Symmetric peg-band half-width as a human percent from on-chain `linearWidth`.
 *
 * Inverse of {@link linearWidthFromSymmetricRangePercent}.
 *
 * @param linearWidth - On-chain `linearWidth` = A · `PEGGED_SWAP_ONE`.
 *
 * X = 1 / (2A + 1),  A = `linearWidth` / `PEGGED_SWAP_ONE`,  percent = X · 100.
 */
export function symmetricRangePercentFromLinearWidth(linearWidth: bigint): number {
  assert(linearWidth >= 0n, 'PeggedSwapMath: linearWidth must be non-negative')
  assert(
    linearWidth <= MAX_LINEAR_WIDTH,
    `PeggedSwapMath: linearWidth exceeds maximum (${MAX_LINEAR_WIDTH})`,
  )

  const x = mulDiv(PEGGED_SWAP_ONE, PEGGED_SWAP_ONE, 2n * linearWidth + PEGGED_SWAP_ONE)

  return scaledFractionToSymmetricRangePercent(x)
}

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

function symmetricRangePercentToScaledFraction(percent: number): bigint {
  return (
    (BigInt(Math.round(percent * PERCENT_PRECISION_NUMBER)) * PEGGED_SWAP_ONE) /
    (100n * PERCENT_PRECISION)
  )
}

function scaledFractionToSymmetricRangePercent(scaledFraction: bigint): number {
  return (
    Number(mulDiv(scaledFraction, 100n * PERCENT_PRECISION, PEGGED_SWAP_ONE)) /
    PERCENT_PRECISION_NUMBER
  )
}

function mulDiv(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) {
    throw new Error('mulDiv: division by zero')
  }

  return (a * b) / c
}
