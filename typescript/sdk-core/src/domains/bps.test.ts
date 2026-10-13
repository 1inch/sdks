import { describe, expect, it } from 'vitest'
import { Bps } from './bps'

describe('Bps', () => {
  it('should scale 1 bps to 10^5 raw units', () => {
    expect(new Bps(1).value).toBe(100_000n)
    expect(new Bps('1').value).toBe(100_000n)
    expect(new Bps(0).value).toBe(0n)
    expect(new Bps(10_000).value).toBe(1_000_000_000n)
  })

  it('should scale fractional bps exactly', () => {
    expect(new Bps(1.1).value).toBe(110_000n)
    expect(new Bps('1.1').value).toBe(110_000n)
    expect(new Bps(2.3).value).toBe(230_000n)
    expect(new Bps(0.00001).value).toBe(1n)
    expect(new Bps('0.00001').toString()).toBe('0.00001')
  })

  it('should round digits past the scale', () => {
    expect(new Bps(1.234567).value).toBe(123_457n)
    expect(new Bps('1.234567').value).toBe(123_457n)
    expect(new Bps(1.234567).toString()).toBe('1.23457')
  })

  it('should reject non-finite and negative values', () => {
    expect(() => new Bps(NaN)).toThrow('Must be a finite number')
    expect(() => new Bps(Infinity)).toThrow('Must be a finite number')
    expect(() => new Bps(-Infinity)).toThrow('Must be a finite number')
    expect(() => new Bps(-1)).toThrow('Must be non-negative')
    expect(() => new Bps('-0.00001')).toThrow('Must be non-negative')
  })
})
