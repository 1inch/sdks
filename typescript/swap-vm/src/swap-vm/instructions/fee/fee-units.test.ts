// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { bpsToFeeUnits, percentToFeeUnits } from './fee-units'

describe('fee units conversion', () => {
  describe('bpsToFeeUnits', () => {
    it('should convert every one-decimal bps value in [0, 10000] exactly', () => {
      const mismatches: number[] = []

      for (let i = 0; i <= 100_000; i++) {
        const bps = i / 10

        if (bpsToFeeUnits(bps) !== BigInt(i) * 10_000n) {
          mismatches.push(bps)
        }
      }

      expect(mismatches).toEqual([])
    })

    it('should convert values whose float product is not an integer', () => {
      expect(1.1 * 100_000).not.toBe(110_000)
      expect(2.3 * 100_000).not.toBe(230_000)

      expect(bpsToFeeUnits(1.1)).toBe(110_000n)
      expect(bpsToFeeUnits(2.3)).toBe(230_000n)
    })

    it('should convert boundary values', () => {
      expect(bpsToFeeUnits(0)).toBe(0n)
      expect(bpsToFeeUnits(0.00001)).toBe(1n)
      expect(bpsToFeeUnits(9999.99999)).toBe(999_999_999n)
      expect(bpsToFeeUnits(10000)).toBe(1_000_000_000n)
    })

    it('should leave the range check to the fee args', () => {
      expect(bpsToFeeUnits(10000.1)).toBe(1_000_010_000n)
    })

    it('should reject values more precise than 0.00001 bps', () => {
      for (const bps of [1.234567, 0.000001, 0.000005, 0.000015, 9999.999999]) {
        expect(() => bpsToFeeUnits(bps)).toThrow(
          `Invalid fee: ${bps} bps. Must be a multiple of 0.00001 bps`,
        )
      }
    })

    it('should reject non-finite values', () => {
      for (const bps of [NaN, Infinity, -Infinity]) {
        expect(() => bpsToFeeUnits(bps)).toThrow(`Invalid fee: ${bps} bps. Must be a finite number`)
      }
    })

    it('should reject negative values', () => {
      for (const bps of [-1, -0.00001, -10000]) {
        expect(() => bpsToFeeUnits(bps)).toThrow(`Invalid fee: ${bps} bps. Must be non-negative`)
      }
    })
  })

  describe('percentToFeeUnits', () => {
    it('should convert every two-decimal percent value in [0, 100] exactly', () => {
      const mismatches: number[] = []

      for (let i = 0; i <= 10_000; i++) {
        const percent = i / 100

        if (percentToFeeUnits(percent) !== BigInt(i) * 100_000n) {
          mismatches.push(percent)
        }
      }

      expect(mismatches).toEqual([])
    })

    it('should convert values whose float product is not an integer', () => {
      expect(0.07 * 10_000_000).not.toBe(700_000)
      expect(0.57 * 10_000_000).not.toBe(5_700_000)

      expect(percentToFeeUnits(0.07)).toBe(700_000n)
      expect(percentToFeeUnits(0.57)).toBe(5_700_000n)
      expect(percentToFeeUnits(1.1)).toBe(11_000_000n)
    })

    it('should convert boundary values', () => {
      expect(percentToFeeUnits(0)).toBe(0n)
      expect(percentToFeeUnits(0.0000001)).toBe(1n)
      expect(percentToFeeUnits(1.0000001)).toBe(10_000_001n)
      expect(percentToFeeUnits(99.9999999)).toBe(999_999_999n)
      expect(percentToFeeUnits(100)).toBe(1_000_000_000n)
    })

    it('should reject values more precise than 0.0000001%', () => {
      for (const percent of [1.23456789, 0.00000001, 0.00000005, 99.99999999]) {
        expect(() => percentToFeeUnits(percent)).toThrow(
          `Invalid fee: ${percent}%. Must be a multiple of 0.0000001%`,
        )
      }
    })

    it('should reject non-finite values', () => {
      for (const percent of [NaN, Infinity, -Infinity]) {
        expect(() => percentToFeeUnits(percent)).toThrow(
          `Invalid fee: ${percent}%. Must be a finite number`,
        )
      }
    })

    it('should reject negative values', () => {
      for (const percent of [-1, -0.0000001, -100]) {
        expect(() => percentToFeeUnits(percent)).toThrow(
          `Invalid fee: ${percent}%. Must be non-negative`,
        )
      }
    })
  })
})
