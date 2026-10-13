import { describe, expect, it } from 'vitest'
import { Bps } from './bps'

describe('Bps', () => {
  it('should scale 1 bps to 10^5 raw units', () => {
    expect(Bps.fromNumber(1).toScaledBigInt()).toBe(100_000n)
    expect(Bps.fromString('1').toScaledBigInt()).toBe(100_000n)
    expect(Bps.fromNumber(0).toScaledBigInt()).toBe(0n)
    expect(Bps.fromNumber(10_000).toScaledBigInt()).toBe(1_000_000_000n)
  })

  it('should scale fractional bps exactly', () => {
    expect(Bps.fromNumber(1.1).toScaledBigInt()).toBe(110_000n)
    expect(Bps.fromString('1.1').toScaledBigInt()).toBe(110_000n)
    expect(Bps.fromNumber(2.3).toScaledBigInt()).toBe(230_000n)
    expect(Bps.fromNumber(0.00001).toScaledBigInt()).toBe(1n)
    expect(Bps.fromString('0.00001').toString()).toBe('0.00001')
  })

  it('should accept a fraction as long as the scale', () => {
    expect(Bps.fromString('1.12345').toScaledBigInt()).toBe(112_345n)
    expect(Bps.fromString('1.10000').toScaledBigInt()).toBe(Bps.fromNumber(1.1).toScaledBigInt())
  })

  it('should reject a fraction longer than the scale', () => {
    expect(() => Bps.fromNumber(1.234567)).toThrow('Must have at most 5 decimal places')
    expect(() => Bps.fromString('1.234567')).toThrow('Must have at most 5 decimal places')
    expect(() => Bps.fromString('1.100000')).toThrow('Must have at most 5 decimal places')
    expect(() => Bps.fromNumber(1e-7)).toThrow('Must have at most 5 decimal places')
  })

  it('should convert back to a number from the formatted string', () => {
    expect(Bps.fromNumber(1.1).toNumber()).toBe(Number(Bps.fromNumber(1.1).toString()))
    expect(Bps.fromString('1.23456').toNumber()).toBe(1.23456)
    expect(Bps.fromNumber(10_000).toNumber()).toBe(10_000)
  })

  it('should reject non-finite and negative values', () => {
    expect(() => Bps.fromNumber(NaN)).toThrow('Must be a finite number')
    expect(() => Bps.fromNumber(Infinity)).toThrow('Must be a finite number')
    expect(() => Bps.fromNumber(-Infinity)).toThrow('Must be a finite number')
    expect(() => Bps.fromNumber(-1)).toThrow('Must be non-negative')
    expect(() => Bps.fromString('-0.00001')).toThrow('Must be non-negative')
  })
})
