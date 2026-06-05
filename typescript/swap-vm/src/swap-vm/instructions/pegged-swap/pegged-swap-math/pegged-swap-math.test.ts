// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import {
  linearWidthFromSymmetricRangePercent,
  MAX_LINEAR_WIDTH,
  normalizeReserve,
  peggedSwapMarginalGtPerLtE18,
  peggedSwapMarginalWeight,
  PEGGED_SWAP_ONE,
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

  it('allows linearWidth at the on-chain maximum (20% symmetric range)', () => {
    expect(linearWidthFromSymmetricRangePercent(20)).toBe(MAX_LINEAR_WIDTH)
  })

  it('rejects zero and 100% symmetric range', () => {
    expect(() => linearWidthFromSymmetricRangePercent(0)).toThrow(/must be positive/)
    expect(() => linearWidthFromSymmetricRangePercent(100)).toThrow(/less than 100%/)
  })

  it('rejects narrow peg bands whose A exceeds 2', () => {
    expect(() => linearWidthFromSymmetricRangePercent(0.2)).toThrow(/exceeds maximum/)
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
