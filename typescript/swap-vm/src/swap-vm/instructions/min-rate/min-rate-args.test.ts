// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { UINT_64_MAX } from '@1inch/byte-utils'
import { MinRateArgs } from './min-rate-args'

describe('MinRateArgs', () => {
  it('should encode and decode min rate args', () => {
    const rateLt = 3000n
    const rateGt = 1n
    const args = new MinRateArgs(rateLt, rateGt)

    const encoded = MinRateArgs.CODER.encode(args)
    expect(encoded.toString()).toBe('0x0000000000000bb80000000000000001')

    const decoded = MinRateArgs.decode(encoded)

    expect(decoded.rateLt).toBe(rateLt)
    expect(decoded.rateGt).toBe(rateGt)
  })

  it('should handle maximum uint64 values', () => {
    const maxUint64 = UINT_64_MAX
    const args = new MinRateArgs(maxUint64, maxUint64)

    const encoded = MinRateArgs.CODER.encode(args)
    const decoded = MinRateArgs.decode(encoded)

    expect(decoded.rateLt).toBe(maxUint64)
    expect(decoded.rateGt).toBe(maxUint64)
  })

  it('should convert to JSON correctly', () => {
    const args = new MinRateArgs(1000n, 2000n)
    const json = args.toJSON()

    expect(json).toEqual({
      rateLt: '1000',
      rateGt: '2000',
    })
  })

  it('should throw on invalid values', () => {
    const maxUint64 = UINT_64_MAX

    expect(() => new MinRateArgs(-1n, 100n)).toThrow()
    expect(() => new MinRateArgs(100n, -1n)).toThrow()
    expect(() => new MinRateArgs(maxUint64 + 1n, 100n)).toThrow()
    expect(() => new MinRateArgs(100n, maxUint64 + 1n)).toThrow()
  })

  it('should decode from hex string', () => {
    const hex = new HexString('0x00000000000003e80000000000000001')
    const decoded = MinRateArgs.decode(hex)
    expect(decoded.rateLt).toBe(1000n)
    expect(decoded.rateGt).toBe(1n)
  })
})
