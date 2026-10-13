import { describe, expect, it } from 'vitest'
import { Bps } from './bps'
import { Percent } from './percent'

describe('Percent', () => {
  it('should scale 1% to 10^7 raw units', () => {
    expect(Percent.fromNumber(1).toScaledBigInt()).toBe(10_000_000n)
    expect(Percent.fromString('1').toScaledBigInt()).toBe(10_000_000n)
    expect(Percent.fromNumber(0).toScaledBigInt()).toBe(0n)
    expect(Percent.fromNumber(100).toScaledBigInt()).toBe(1_000_000_000n)
  })

  it('should match bps at the 1% = 100 bps boundary', () => {
    expect(Percent.fromNumber(1).toScaledBigInt()).toBe(Bps.fromNumber(100).toScaledBigInt())
    expect(Percent.fromNumber(0.01).toScaledBigInt()).toBe(Bps.fromNumber(1).toScaledBigInt())
    expect(Percent.fromNumber(0.011).toScaledBigInt()).toBe(Bps.fromNumber(1.1).toScaledBigInt())
    expect(Percent.fromString('0.57').toScaledBigInt()).toBe(5_700_000n)
  })

  it('should scale the smallest fee unit from a decimal string', () => {
    expect(Percent.fromString('0.0000001').toScaledBigInt()).toBe(1n)
    expect(Percent.fromString('0.0000001').toString()).toBe('0.0000001')
  })

  it('should accept a fraction as long as the scale', () => {
    expect(Percent.fromString('1.1234567').toScaledBigInt()).toBe(11_234_567n)
  })

  it('should reject a fraction longer than the scale', () => {
    expect(() => Percent.fromNumber(1.23456789)).toThrow('Must have at most 7 decimal places')
    expect(() => Percent.fromString('1.23456789')).toThrow('Must have at most 7 decimal places')
  })

  it('should reject exponent notation', () => {
    expect(() => Percent.fromNumber(0.0000001)).toThrow('Exponent notation is not allowed')
    expect(() => Percent.fromNumber(1e-7)).toThrow('Exponent notation is not allowed')
    expect(() => Percent.fromString('1e-8')).toThrow('Exponent notation is not allowed')
  })

  it('should convert back to a number from the formatted string', () => {
    expect(Percent.fromNumber(0.57).toNumber()).toBe(Number(Percent.fromNumber(0.57).toString()))
    expect(Percent.fromString('1.2345678').toNumber()).toBe(1.2345678)
    expect(Percent.fromNumber(100).toNumber()).toBe(100)
  })

  it('should restore a scaled bigint', () => {
    expect(Percent.fromScaledBigInt(10_000_000n).toNumber()).toBe(1)
    expect(Percent.fromScaledBigInt(Percent.fromString('0.57').toScaledBigInt()).toString()).toBe(
      '0.57',
    )
    expect(() => Percent.fromScaledBigInt(-1n)).toThrow('Must be non-negative')
  })

  it('should reject non-finite and negative values', () => {
    expect(() => Percent.fromNumber(NaN)).toThrow('Must be a finite number')
    expect(() => Percent.fromNumber(Infinity)).toThrow('Must be a finite number')
    expect(() => Percent.fromNumber(-0.1)).toThrow('Must be non-negative')
    expect(() => Percent.fromString('-1')).toThrow('Must be non-negative')
  })
})
