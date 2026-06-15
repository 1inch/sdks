// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import {
  linearWidthFromSymmetricRangePercent,
  MAX_LINEAR_WIDTH,
  normalizeReserve,
  peggedSwapMarginalGtPerLtE18,
  peggedSwapMarginalWeight,
  PEGGED_SWAP_ONE,
  symmetricRangePercentFromLinearWidth,
} from './pegged-swap-math'
import { bigintSqrt } from '../../utils'

const LINEAR_WIDTH = 8n * 10n ** 26n

describe('linearWidthFromSymmetricRangePercent', () => {
  it('computes linearWidth = (1 - X) / (2X) · ONE via mulDiv', () => {
    const linearWidth = linearWidthFromSymmetricRangePercent(25)
    expect(linearWidth).toBe(15n * 10n ** 26n)
  })

  it('supports fractional percents', () => {
    const linearWidth = linearWidthFromSymmetricRangePercent(25.5)
    expect(linearWidth).toBe(1460784313725490196078431372n)
  })

  it('maps a 20% symmetric range to A = 2', () => {
    expect(linearWidthFromSymmetricRangePercent(20)).toBe(2n * PEGGED_SWAP_ONE)
  })

  it('allows narrow peg bands up to the on-chain maximum (A ≈ 5000 at the 0.01% floor)', () => {
    // X = 0.0001 → A = (1 - X) / (2X) = 4999.5 → 4999.5e27 ≤ MAX_LINEAR_WIDTH (5000e27).
    expect(linearWidthFromSymmetricRangePercent(0.01)).toBe(49995n * 10n ** 26n)
  })

  it('rejects zero and 100% symmetric range', () => {
    expect(() => linearWidthFromSymmetricRangePercent(0)).toThrow(/must be positive/)
    expect(() => linearWidthFromSymmetricRangePercent(100)).toThrow(/less than 100%/)
  })

  it('rejects peg bands tighter than the A ≤ 5000 floor', () => {
    expect(() => linearWidthFromSymmetricRangePercent(0.001)).toThrow(/exceeds maximum/)
  })
})

describe('symmetricRangePercentFromLinearWidth', () => {
  it('computes percent = 100 / (2A + 1) (inverse of the forward mapping)', () => {
    expect(symmetricRangePercentFromLinearWidth(15n * 10n ** 26n)).toBe(25)
  })

  it('returns 20% at A = 2', () => {
    expect(symmetricRangePercentFromLinearWidth(2n * PEGGED_SWAP_ONE)).toBe(20)
  })

  it('returns ≈0.009999% at the on-chain maximum linearWidth (A = 5000)', () => {
    expect(symmetricRangePercentFromLinearWidth(MAX_LINEAR_WIDTH)).toBeCloseTo(100 / 10001, 6)
  })

  it('returns 100% when linearWidth is zero', () => {
    expect(symmetricRangePercentFromLinearWidth(0n)).toBe(100)
  })

  it('rejects negative linearWidth', () => {
    expect(() => symmetricRangePercentFromLinearWidth(-1n)).toThrow(/must be non-negative/)
  })

  it('rejects linearWidth above the on-chain maximum', () => {
    expect(() => symmetricRangePercentFromLinearWidth(MAX_LINEAR_WIDTH + 1n)).toThrow(
      /exceeds maximum/,
    )
  })

  it('round-trips percent -> linearWidth -> percent', () => {
    for (const percent of [0.01, 0.1, 1, 20, 25, 25.5, 33.33, 50, 99]) {
      const linearWidth = linearWidthFromSymmetricRangePercent(percent)
      expect(symmetricRangePercentFromLinearWidth(linearWidth)).toBeCloseTo(percent, 10)
    }
  })

  it('round-trips linearWidth -> percent -> linearWidth within rounding', () => {
    for (const linearWidth of [
      10n ** 26n,
      5n * 10n ** 26n,
      10n ** 27n,
      15n * 10n ** 26n,
      2n * PEGGED_SWAP_ONE,
    ]) {
      const percent = symmetricRangePercentFromLinearWidth(linearWidth)
      const recovered = linearWidthFromSymmetricRangePercent(percent)
      const tolerance = PEGGED_SWAP_ONE / 10n ** 13n
      const delta = recovered > linearWidth ? recovered - linearWidth : linearWidth - recovered
      expect(delta).toBeLessThanOrEqual(tolerance)
    }
  })

  it('round-trips exactly for clean percents', () => {
    for (const percent of [0.01, 0.1, 20, 25, 50]) {
      const linearWidth = linearWidthFromSymmetricRangePercent(percent)
      expect(symmetricRangePercentFromLinearWidth(linearWidth)).toBe(percent)
    }
  })
})

describe('peggedSwapMath', () => {
  it('normalizeReserve is ONE when current equals initial', () => {
    const initial = 10n ** 18n
    expect(normalizeReserve(initial, initial)).toBe(PEGGED_SWAP_ONE)
  })

  it('marginal weight at u = ONE', () => {
    const sqrtCoord = bigintSqrt(PEGGED_SWAP_ONE * PEGGED_SWAP_ONE)
    const weight = peggedSwapMarginalWeight(sqrtCoord, LINEAR_WIDTH)
    expect(weight).toBe((PEGGED_SWAP_ONE * PEGGED_SWAP_ONE) / (2n * sqrtCoord) + LINEAR_WIDTH)
  })

  it('marginal price at center equals y0·rateLt/(x0·rateGt) in 1e18', () => {
    const x0 = 10n ** 18n
    const y0 = 2n * 10n ** 18n
    const rateLt = 1n
    const rateGt = 1n
    const marginal = peggedSwapMarginalGtPerLtE18(x0, y0, x0, y0, LINEAR_WIDTH, rateLt, rateGt)
    expect(marginal).toBe((y0 * rateLt * 10n ** 18n) / (x0 * rateGt))
  })

  it('marginal price at center with lt 6 / gt 18 decimals', () => {
    const x0 = 10n ** 18n
    const y0 = 2n * 10n ** 18n
    const rateLt = 10n ** 12n
    const rateGt = 1n
    const marginal = peggedSwapMarginalGtPerLtE18(x0, y0, x0, y0, LINEAR_WIDTH, rateLt, rateGt)
    expect(marginal).toBe(2n * 10n ** 30n)
  })

  it('marginal price differs when current reserves differ from initial', () => {
    const x0 = 10n ** 18n
    const y0 = 10n ** 18n
    const atCenter = peggedSwapMarginalGtPerLtE18(x0, y0, x0, y0, LINEAR_WIDTH, 1n, 1n)
    const offCenter = peggedSwapMarginalGtPerLtE18(
      993_000_000_000_000_000n,
      999_360_128_962_949_073n,
      x0,
      y0,
      LINEAR_WIDTH,
      1n,
      1n,
    )
    expect(offCenter).not.toBe(atCenter)
    expect(offCenter).toBeGreaterThan(atCenter)
  })
})
