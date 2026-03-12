// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { FlatFeeArgs } from './flat-fee-args'

describe('FlatFeeArgs', () => {
  it('should encode and decode flat fee args', () => {
    const fee = 30000000n
    const args = new FlatFeeArgs(fee)

    const encoded = FlatFeeArgs.CODER.encode(args)
    expect(encoded.toString()).toBe('0x01c9c380')

    const decoded = FlatFeeArgs.decode(encoded)
    expect(decoded.fee).toBe(fee)
  })

  it('should handle maximum fee (100%)', () => {
    const maxFee = 1000000000n
    const args = new FlatFeeArgs(maxFee)

    const encoded = FlatFeeArgs.CODER.encode(args)
    const decoded = FlatFeeArgs.decode(encoded)

    expect(decoded.fee).toBe(maxFee)
  })

  it('should handle minimum fee (0%)', () => {
    const minFee = 0n
    const args = new FlatFeeArgs(minFee)

    const encoded = FlatFeeArgs.CODER.encode(args)
    expect(encoded.toString()).toBe('0x00000000')

    const decoded = FlatFeeArgs.decode(encoded)
    expect(decoded.fee).toBe(minFee)
  })

  it('should convert to JSON correctly', () => {
    const args = new FlatFeeArgs(15000000n)
    const json = args.toJSON()

    expect(json).toEqual({
      fee: '15000000',
    })
  })

  it('should throw on invalid values', () => {
    const maxUint32 = (1n << 32n) - 1n
    const FEE_100_PERCENT = 1000000000n

    expect(() => new FlatFeeArgs(-1n)).toThrow()

    expect(() => new FlatFeeArgs(maxUint32 + 1n)).toThrow()

    expect(() => new FlatFeeArgs(FEE_100_PERCENT + 1n)).toThrow('Fee out of range')
  })

  it('should handle common fee percentages', () => {
    const testCases = [
      { pct: '0.1%', value: 1000000n },
      { pct: '0.3%', value: 3000000n },
      { pct: '1%', value: 10000000n },
      { pct: '2.5%', value: 25000000n },
      { pct: '5%', value: 50000000n },
      { pct: '10%', value: 100000000n },
    ]

    testCases.forEach(({ value }) => {
      const args = new FlatFeeArgs(value)
      const encoded = FlatFeeArgs.CODER.encode(args)
      const decoded = FlatFeeArgs.decode(encoded)

      expect(decoded.fee).toBe(value)
    })
  })

  it('should enforce fee limit (100%)', () => {
    const FEE_100_PERCENT = 1000000000n

    expect(() => new FlatFeeArgs(FEE_100_PERCENT)).not.toThrow()

    expect(() => new FlatFeeArgs(FEE_100_PERCENT + 1n)).toThrow()
    expect(() => new FlatFeeArgs(2n * FEE_100_PERCENT)).toThrow()
  })

  it('should create from basis points correctly', () => {
    const testCases = [
      { bps: 0, expectedFee: 0n },
      { bps: 1, expectedFee: 100000n },
      { bps: 10, expectedFee: 1000000n },
      { bps: 30, expectedFee: 3000000n },
      { bps: 100, expectedFee: 10000000n },
      { bps: 250, expectedFee: 25000000n },
      { bps: 500, expectedFee: 50000000n },
      { bps: 1000, expectedFee: 100000000n },
      { bps: 10000, expectedFee: 1000000000n },
    ]

    testCases.forEach(({ bps, expectedFee }) => {
      const args = FlatFeeArgs.fromBps(bps)
      expect(args).toBeInstanceOf(FlatFeeArgs)
      expect(args.fee).toBe(expectedFee)

      // Verify encoding/decoding works
      const encoded = FlatFeeArgs.CODER.encode(args)
      const decoded = FlatFeeArgs.decode(encoded)
      expect(decoded.fee).toBe(expectedFee)
    })
  })

  it('should create from percent correctly and be consistent with fromBps', () => {
    const testCases = [
      { percent: 0.01, expectedFee: 100000n },
      { percent: 0.1, expectedFee: 1000000n },
      { percent: 1, expectedFee: 10000000n },
      { percent: 2.5, expectedFee: 25000000n },
      { percent: 10, expectedFee: 100000000n },
      { percent: 100, expectedFee: 1000000000n },
    ]

    testCases.forEach(({ percent, expectedFee }) => {
      const args = FlatFeeArgs.fromPercent(percent)
      expect(args).toBeInstanceOf(FlatFeeArgs)
      expect(args.fee).toBe(expectedFee)
    })

    const percent1 = FlatFeeArgs.fromPercent(1)
    const bps100 = FlatFeeArgs.fromBps(100)
    expect(percent1.fee).toBe(bps100.fee)

    const percent001 = FlatFeeArgs.fromPercent(0.01)
    const bps1 = FlatFeeArgs.fromBps(1)
    expect(percent001.fee).toBe(bps1.fee)

    const percent10 = FlatFeeArgs.fromPercent(10)
    const bps1000 = FlatFeeArgs.fromBps(1000)
    expect(percent10.fee).toBe(bps1000.fee)
  })
})
