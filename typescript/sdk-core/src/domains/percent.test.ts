import { describe, expect, it } from 'vitest'
import { Bps } from './bps'
import { Percent } from './percent'

describe('Percent', () => {
  it('should scale 1% to 10^7 raw units', () => {
    expect(new Percent(1).value).toBe(10_000_000n)
    expect(new Percent('1').value).toBe(10_000_000n)
    expect(new Percent(0).value).toBe(0n)
    expect(new Percent(100).value).toBe(1_000_000_000n)
  })

  it('should match bps at the 1% = 100 bps boundary', () => {
    expect(new Percent(1).value).toBe(new Bps(100).value)
    expect(new Percent(0.01).value).toBe(new Bps(1).value)
    expect(new Percent(0.011).value).toBe(new Bps(1.1).value)
    expect(new Percent('0.57').value).toBe(5_700_000n)
  })

  it('should scale the smallest fee unit', () => {
    expect(new Percent(0.0000001).value).toBe(1n)
    expect(new Percent('0.0000001').toString()).toBe('0.0000001')
  })

  it('should round digits past the scale', () => {
    expect(new Percent(1.23456789).value).toBe(12_345_679n)
    expect(new Percent('1.23456789').toString()).toBe('1.2345679')
    expect(new Percent(0.00000001).value).toBe(0n)
  })

  it('should reject non-finite and negative values', () => {
    expect(() => new Percent(NaN)).toThrow('Must be a finite number')
    expect(() => new Percent(Infinity)).toThrow('Must be a finite number')
    expect(() => new Percent(-0.1)).toThrow('Must be non-negative')
    expect(() => new Percent('-1')).toThrow('Must be non-negative')
  })
})
