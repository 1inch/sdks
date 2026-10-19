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

  it('keeps the sign of negative values and rounds them half away from zero', () => {
    expect(truncateHumanDecimalString('-1.5', 1)).toBe('-1.5')
    expect(truncateHumanDecimalString('-0.25', 1)).toBe('-0.3')
    expect(truncateHumanDecimalString('-1.994', 2)).toBe('-1.99')
    expect(truncateHumanDecimalString('-1.9999', 2)).toBe('-2')
    expect(truncateHumanDecimalString('-3.141592653589793', 4)).toBe('-3.1416')
    expect(truncateHumanDecimalString('-1.2300', 4)).toBe('-1.23')
  })

  it('rounds negative values to an integer when maxFrac is 0', () => {
    expect(truncateHumanDecimalString('-1.6', 0)).toBe('-2')
    expect(truncateHumanDecimalString('-0.5', 0)).toBe('-1')
    expect(truncateHumanDecimalString('-123.456', 0)).toBe('-123')
    expect(truncateHumanDecimalString('-123.567', 0)).toBe('-124')
  })

  it('returns 0, not -0, when a negative value rounds to zero', () => {
    expect(truncateHumanDecimalString('-0.04', 1)).toBe('0')
    expect(truncateHumanDecimalString('-0.4', 0)).toBe('0')
    expect(truncateHumanDecimalString('-0.000', 2)).toBe('0')
    expect(truncateHumanDecimalString('-0', 2)).toBe('0')
  })

  it('returns negative integers without a decimal point unchanged', () => {
    expect(truncateHumanDecimalString('-2500', 6)).toBe('-2500')
    expect(truncateHumanDecimalString('-42', 0)).toBe('-42')
  })

  it('rejects negative maxFrac', () => {
    expect(() => truncateHumanDecimalString('1.0', -1)).toThrow('maxFrac must be non-negative')
  })
})
