// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { computeDeltas } from './utils'

const TEN_POW_18 = 10n ** 18n

describe('computeDeltas', () => {
  const balanceA = 1000n * TEN_POW_18
  const balanceB = 2000n * TEN_POW_18
  const insideRange = [2n * TEN_POW_18, TEN_POW_18, 4n * TEN_POW_18] as const

  describe('range boundaries', () => {
    it('should return a zero deltaA when the price sits on the lower bound', () => {
      const { deltaA } = computeDeltas(balanceA, balanceB, TEN_POW_18, TEN_POW_18, 4n * TEN_POW_18)

      expect(deltaA).toBe(0n)
    })

    it('should return a zero deltaB when the price sits on the upper bound', () => {
      const { deltaB } = computeDeltas(
        balanceA,
        balanceB,
        4n * TEN_POW_18,
        TEN_POW_18,
        4n * TEN_POW_18,
      )

      expect(deltaB).toBe(0n)
    })

    it('should return both deltas as zero when the range collapses to a point', () => {
      const { deltaA, deltaB } = computeDeltas(
        balanceA,
        balanceB,
        TEN_POW_18,
        TEN_POW_18,
        TEN_POW_18,
      )

      expect(deltaA).toBe(0n)
      expect(deltaB).toBe(0n)
    })

    it('should return zero deltas for zero balances', () => {
      const { deltaA, deltaB } = computeDeltas(0n, 0n, ...insideRange)

      expect(deltaA).toBe(0n)
      expect(deltaB).toBe(0n)
    })
  })

  describe('sqrt guard clauses', () => {
    it('should short-circuit when the price ratio floors below 2', () => {
      // (price * 1e18) / priceMin === 1, which hits sqrt's `value < 2n` branch.
      const { deltaA } = computeDeltas(balanceA, balanceB, 1n, TEN_POW_18, 4n * TEN_POW_18)

      expect(typeof deltaA).toBe('bigint')
    })

    it('should reject a negative price ratio', () => {
      // NOTE: sqrt throws a bare string rather than an Error, so this cannot be
      // matched with toThrow(Error).
      expect(() =>
        computeDeltas(balanceA, balanceB, -TEN_POW_18, TEN_POW_18, 4n * TEN_POW_18),
      ).toThrow('square root of negative numbers is not supported')
    })
  })

  describe('linearity in balances', () => {
    it('should scale deltaA proportionally with balanceA', () => {
      const single = computeDeltas(balanceA, balanceB, ...insideRange)
      const double = computeDeltas(balanceA * 2n, balanceB, ...insideRange)

      expect(double.deltaA).toBe(single.deltaA * 2n)
      expect(double.deltaB).toBe(single.deltaB)
    })

    it('should scale deltaB proportionally with balanceB', () => {
      const single = computeDeltas(balanceA, balanceB, ...insideRange)
      const double = computeDeltas(balanceA, balanceB * 2n, ...insideRange)

      expect(double.deltaB).toBe(single.deltaB * 2n)
      expect(double.deltaA).toBe(single.deltaA)
    })
  })

  describe('known fixed-point scale defect', () => {
    /**
     * `sqrt()` halves the fixed-point scale: its argument is 1e18-scaled, so the
     * result comes back 1e9-scaled. `computeDeltas` then subtracts `TEN_POW_18`
     * (1e18) from that 1e9-scaled value, which is negative for every realistic
     * input - e.g. sqrt(2e18) = 1_414_213_562, and 1_414_213_562 - 1e18 < 0.
     *
     * The upshot is that both deltas are negative whenever the price lies
     * strictly between priceMin and priceMax; only the explicit boundary
     * ternaries return a sane value. Staying in 1e18 fixed point would require
     * squaring the numerator scale, i.e. sqrt((price * 1e36) / priceMin).
     *
     * `it.fails` keeps this documented and green while the defect stands; it
     * will start failing the moment the maths is corrected, prompting whoever
     * fixes it to promote this to a normal assertion.
     */
    it.fails('should produce positive deltas for a price strictly inside the range', () => {
      const { deltaA, deltaB } = computeDeltas(balanceA, balanceB, ...insideRange)

      expect(deltaA).toBeGreaterThan(0n)
      expect(deltaB).toBeGreaterThan(0n)
    })

    it('currently returns negative deltas inside the range', () => {
      const { deltaA, deltaB } = computeDeltas(balanceA, balanceB, ...insideRange)

      expect(deltaA).toBeLessThan(0n)
      expect(deltaB).toBeLessThan(0n)
    })
  })
})
