// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import assert from 'assert'

type FeeScale = {
  unitsPerValue: number
  suffix: string
  step: string
}

/** 1e9 fee units = 100%, so 1 bps = 100_000 units */
const BPS: FeeScale = { unitsPerValue: 100_000, suffix: ' bps', step: '0.00001 bps' }

/** 1e9 fee units = 100%, so 1% = 10_000_000 units */
const PERCENT: FeeScale = { unitsPerValue: 10_000_000, suffix: '%', step: '0.0000001%' }

/**
 * Binary floating-point noise of scaling a decimal input, e.g. `1.1 * 100_000 = 110000.00000000001`.
 * Inputs further than this from a whole number of units are more precise than 1 fee unit
 */
const MAX_RELATIVE_ROUNDING_ERROR = 4 * Number.EPSILON

/**
 * Converts a fee in basis points to fee units (1e9 = 100%, 1 bps = 100_000 units)
 * without floating-point truncation, e.g. `1.1` -> `110_000n`
 * @param bps - Fee in basis points with at most 5 decimal places (1 unit = 0.00001 bps)
 * @throws if `bps` is not finite, is negative or is not a whole number of fee units
 */
export function bpsToFeeUnits(bps: number): bigint {
  return toFeeUnits(bps, BPS)
}

/**
 * Converts a fee in percent to fee units (1e9 = 100%, 1% = 10_000_000 units)
 * without floating-point truncation, e.g. `1.1` -> `11_000_000n`
 * @param percent - Fee in percent with at most 7 decimal places (1 unit = 0.0000001%)
 * @throws if `percent` is not finite, is negative or is not a whole number of fee units
 */
export function percentToFeeUnits(percent: number): bigint {
  return toFeeUnits(percent, PERCENT)
}

function toFeeUnits(value: number, scale: FeeScale): bigint {
  assert(Number.isFinite(value), `Invalid fee: ${value}${scale.suffix}. Must be a finite number`)
  assert(value >= 0, `Invalid fee: ${value}${scale.suffix}. Must be non-negative`)

  const units = value * scale.unitsPerValue
  const rounded = Math.round(units)

  assert(
    Math.abs(units - rounded) <= Math.max(rounded, 1) * MAX_RELATIVE_ROUNDING_ERROR,
    `Invalid fee: ${value}${scale.suffix}. Must be a multiple of ${scale.step} (1 fee unit, 1e9 = 100%)`,
  )

  return BigInt(rounded)
}
