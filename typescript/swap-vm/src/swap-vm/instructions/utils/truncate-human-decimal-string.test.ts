// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { truncateHumanDecimalString } from './truncate-human-decimal-string'

describe('truncateHumanDecimalString', () => {
  it('returns integer-only when maxFrac is 0 (half-up on first fractional digit)', () => {
    expect(truncateHumanDecimalString('123.456', 0)).toBe('123')
    expect(truncateHumanDecimalString('123.567', 0)).toBe('124')
    expect(truncateHumanDecimalString('123', 0)).toBe('123')
  })

  it('returns unchanged when there is no decimal point', () => {
    expect(truncateHumanDecimalString('2500', 6)).toBe('2500')
    expect(truncateHumanDecimalString('0', 18)).toBe('0')
  })

  it('rounds half-up at maxFrac (first dropped digit >= 5 increments last kept digit)', () => {
    expect(truncateHumanDecimalString('1.9999', 2)).toBe('2')
    expect(truncateHumanDecimalString('1.994', 2)).toBe('1.99')
    expect(truncateHumanDecimalString('2000.000000000000000000131782', 6)).toBe('2000')
  })

  it('strips trailing zeros after rounding', () => {
    expect(truncateHumanDecimalString('2000.000000', 6)).toBe('2000')
    expect(truncateHumanDecimalString('1.2300', 4)).toBe('1.23')
  })

  it('keeps non-zero fractional digits up to maxFrac (half-up)', () => {
    expect(truncateHumanDecimalString('0.000499999999999999999999', 18)).toBe('0.0005')
    expect(truncateHumanDecimalString('3.141592653589793', 4)).toBe('3.1416')
  })

  it('does not pad when fractional part is shorter than maxFrac', () => {
    expect(truncateHumanDecimalString('1.5', 6)).toBe('1.5')
  })

  it('handles maxFrac larger than available fractional digits', () => {
    expect(truncateHumanDecimalString('10.12', 10)).toBe('10.12')
  })

  it('handles empty fractional after strip (integer)', () => {
    expect(truncateHumanDecimalString('42.000000', 6)).toBe('42')
  })
})
