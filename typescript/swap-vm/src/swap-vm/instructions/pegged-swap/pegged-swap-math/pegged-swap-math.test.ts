// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import {
  normalizeReserve,
  peggedSwapMarginalGtPerLtE18,
  peggedSwapMarginalWeight,
  PEGGED_SWAP_ONE,
} from './pegged-swap-math'
import { bigintSqrt } from '../../utils'

const LINEAR_WIDTH = 8n * 10n ** 26n

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
