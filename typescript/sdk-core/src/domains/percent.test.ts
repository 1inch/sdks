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

  it('should scale the smallest fee unit', () => {
    expect(Percent.fromNumber(0.0000001).toScaledBigInt()).toBe(1n)
    expect(Percent.fromString('0.0000001').toString()).toBe('0.0000001')
  })

  it('should round digits past the scale', () => {
    expect(Percent.fromNumber(1.23456789).toScaledBigInt()).toBe(12_345_679n)
    expect(Percent.fromString('1.23456789').toString()).toBe('1.2345679')
    expect(Percent.fromNumber(0.00000001).toScaledBigInt()).toBe(0n)
  })

  it('should convert back to a number from the formatted string', () => {
    expect(Percent.fromNumber(0.57).toNumber()).toBe(Number(Percent.fromNumber(0.57).toString()))
    expect(Percent.fromString('1.23456789').toNumber()).toBe(1.2345679)
    expect(Percent.fromNumber(100).toNumber()).toBe(100)
  })

  it('should reject non-finite and negative values', () => {
    expect(() => Percent.fromNumber(NaN)).toThrow('Must be a finite number')
    expect(() => Percent.fromNumber(Infinity)).toThrow('Must be a finite number')
    expect(() => Percent.fromNumber(-0.1)).toThrow('Must be non-negative')
    expect(() => Percent.fromString('-1')).toThrow('Must be non-negative')
  })
})
