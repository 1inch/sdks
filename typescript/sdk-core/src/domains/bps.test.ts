import { describe, expect, it } from 'vitest'
import { Bps } from './bps'

describe('Bps', () => {
  it('should scale 1 bps to 10^5 raw units', () => {
    expect(Bps.fromNumber(1).toScaledBigInt()).toBe(100_000n)
    expect(Bps.fromString('1').toScaledBigInt()).toBe(100_000n)
    expect(Bps.fromNumber(0).toScaledBigInt()).toBe(0n)
    expect(Bps.fromNumber(10_000).toScaledBigInt()).toBe(1_000_000_000n)
    expect(new Bps(100_000n).toScaledBigInt()).toBe(100_000n)
  })

  it('should scale fractional bps exactly', () => {
    expect(Bps.fromNumber(1.1).toScaledBigInt()).toBe(110_000n)
    expect(Bps.fromString('1.1').toScaledBigInt()).toBe(110_000n)
    expect(Bps.fromNumber(2.3).toScaledBigInt()).toBe(230_000n)
    expect(Bps.fromNumber(0.00001).toScaledBigInt()).toBe(1n)
    expect(Bps.fromString('0.00001').toString()).toBe('0.00001')
  })

  it('should round digits past the scale', () => {
    expect(Bps.fromNumber(1.234567).toScaledBigInt()).toBe(123_457n)
    expect(Bps.fromString('1.234567').toScaledBigInt()).toBe(123_457n)
    expect(Bps.fromNumber(1.234567).toString()).toBe('1.23457')
  })

  it('should convert back to a number from the formatted string', () => {
    expect(Bps.fromNumber(1.1).toNumber()).toBe(Number(Bps.fromNumber(1.1).toString()))
    expect(Bps.fromString('1.234567').toNumber()).toBe(1.23457)
    expect(Bps.fromNumber(10_000).toNumber()).toBe(10_000)
  })

  it('should reject non-finite and negative values', () => {
    expect(() => Bps.fromNumber(NaN)).toThrow('Must be a finite number')
    expect(() => Bps.fromNumber(Infinity)).toThrow('Must be a finite number')
    expect(() => Bps.fromNumber(-Infinity)).toThrow('Must be a finite number')
    expect(() => Bps.fromNumber(-1)).toThrow('Must be non-negative')
    expect(() => Bps.fromString('-0.00001')).toThrow('Must be non-negative')
    expect(() => new Bps(-1n)).toThrow('Must be non-negative')
  })
})
