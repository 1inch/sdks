// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { StableSwap2DArgs } from './stable-swap-2d-args'

describe('StableSwap2DArgs', () => {
  it('should encode and decode stable swap args', () => {
    const fee = 3000000n
    const A = 100n
    const rateLt = 1000000000000000000n
    const rateGt = 1000000000000000000n

    const args = new StableSwap2DArgs(fee, A, rateLt, rateGt)

    const encoded = StableSwap2DArgs.CODER.encode(args)
    const decoded = StableSwap2DArgs.decode(encoded)

    expect(decoded.fee).toBe(fee)
    expect(decoded.A).toBe(A)
    expect(decoded.rateLt).toBe(rateLt)
    expect(decoded.rateGt).toBe(rateGt)
  })

  it('should handle maximum values', () => {
    const maxUint32 = (1n << 32n) - 1n
    const maxRate = 10n ** 30n

    const args = new StableSwap2DArgs(maxUint32, maxUint32, maxRate, maxRate)

    const encoded = StableSwap2DArgs.CODER.encode(args)
    const decoded = StableSwap2DArgs.decode(encoded)

    expect(decoded.fee).toBe(maxUint32)
    expect(decoded.A).toBe(maxUint32)
    expect(decoded.rateLt).toBe(maxRate)
    expect(decoded.rateGt).toBe(maxRate)
  })

  it('should convert to JSON correctly', () => {
    const args = new StableSwap2DArgs(3000000n, 100n, 1000000000000000000n, 1000000000000000000n)
    const json = args.toJSON()

    expect(json).toEqual({
      fee: '3000000',
      A: '100',
      rateLt: '1000000000000000000',
      rateGt: '1000000000000000000',
    })
  })

  it('should throw on invalid values', () => {
    const maxUint32 = (1n << 32n) - 1n

    expect(() => new StableSwap2DArgs(-1n, 100n, 1n, 1n)).toThrow()
    expect(() => new StableSwap2DArgs(maxUint32 + 1n, 100n, 1n, 1n)).toThrow()

    expect(() => new StableSwap2DArgs(100n, -1n, 1n, 1n)).toThrow()
    expect(() => new StableSwap2DArgs(100n, maxUint32 + 1n, 1n, 1n)).toThrow()

    expect(() => new StableSwap2DArgs(100n, 100n, 0n, 1n)).toThrow(
      'Must be positive and <= UINT_256_MAX',
    )
    expect(() => new StableSwap2DArgs(100n, 100n, 1n, 0n)).toThrow(
      'Must be positive and <= UINT_256_MAX',
    )
  })

  it('should handle realistic stablecoin swap scenarios', () => {
    const args = new StableSwap2DArgs(1000000n, 200n, 999800000000000000n, 1000200000000000000n)

    const encoded = StableSwap2DArgs.CODER.encode(args)
    const decoded = StableSwap2DArgs.decode(encoded)

    expect(decoded.fee).toBe(1000000n)
    expect(decoded.A).toBe(200n)
    expect(decoded.rateLt).toBe(999800000000000000n)
    expect(decoded.rateGt).toBe(1000200000000000000n)
  })

  it('should enforce positive rates and UINT_256_MAX bounds', () => {
    const maxUint256 = 2n ** 256n - 1n

    expect(() => new StableSwap2DArgs(100n, 100n, 0n, 1n)).toThrow()
    expect(() => new StableSwap2DArgs(100n, 100n, 1n, 0n)).toThrow()
    expect(() => new StableSwap2DArgs(100n, 100n, -1n, 1n)).toThrow()
    expect(() => new StableSwap2DArgs(100n, 100n, 1n, -1n)).toThrow()
    expect(() => new StableSwap2DArgs(100n, 100n, maxUint256 + 1n, 1n)).toThrow()
    expect(() => new StableSwap2DArgs(100n, 100n, 1n, maxUint256 + 1n)).toThrow()
  })
})
