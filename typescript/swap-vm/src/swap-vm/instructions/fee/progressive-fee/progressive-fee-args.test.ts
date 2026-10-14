// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { ProgressiveFeeArgs } from './progressive-fee-args'

describe('ProgressiveFeeArgs', () => {
  const FEE_100_PERCENT = 1000000000n

  it('should encode and decode progressive fee args', () => {
    const fee = 45000000n
    const args = new ProgressiveFeeArgs(fee)

    const encoded = ProgressiveFeeArgs.CODER.encode(args)
    expect(encoded.toString()).toBe('0x02aea540')

    const decoded = ProgressiveFeeArgs.decode(encoded)
    expect(decoded).toBeInstanceOf(ProgressiveFeeArgs)
    expect(decoded.fee).toBe(fee)
  })

  it('should handle minimum fee (0%)', () => {
    const encoded = ProgressiveFeeArgs.CODER.encode(new ProgressiveFeeArgs(0n))
    expect(encoded.toString()).toBe('0x00000000')

    expect(ProgressiveFeeArgs.decode(encoded).fee).toBe(0n)
  })

  it('should accept a 100% fee', () => {
    const encoded = ProgressiveFeeArgs.CODER.encode(new ProgressiveFeeArgs(FEE_100_PERCENT))
    expect(encoded.toString()).toBe('0x3b9aca00')

    expect(ProgressiveFeeArgs.decode(encoded).fee).toBe(FEE_100_PERCENT)
  })

  it('should reject a fee above 100%', () => {
    expect(() => new ProgressiveFeeArgs(FEE_100_PERCENT + 1n)).toThrow(
      'Fee out of range: 1000000001. Must be <= 1000000000',
    )
    expect(() => new ProgressiveFeeArgs(2n * FEE_100_PERCENT)).toThrow('Fee out of range')
  })

  it('should reject a fee above 100% when decoding', () => {
    expect(() => ProgressiveFeeArgs.decode(new HexString('0x3b9aca01'))).toThrow(
      'Fee out of range: 1000000001. Must be <= 1000000000',
    )
    expect(() => ProgressiveFeeArgs.decode(new HexString('0xffffffff'))).toThrow(
      'Fee out of range: 4294967295. Must be <= 1000000000',
    )
  })

  it('should reject values outside uint32', () => {
    const maxUint32 = (1n << 32n) - 1n

    expect(() => new ProgressiveFeeArgs(-1n)).toThrow('Invalid fee: -1. Must be a valid uint32')
    expect(() => new ProgressiveFeeArgs(maxUint32 + 1n)).toThrow(
      'Invalid fee: 4294967296. Must be a valid uint32',
    )
  })

  it('should convert to JSON correctly', () => {
    expect(new ProgressiveFeeArgs(55000000n).toJSON()).toEqual({ fee: '55000000' })
  })
})
