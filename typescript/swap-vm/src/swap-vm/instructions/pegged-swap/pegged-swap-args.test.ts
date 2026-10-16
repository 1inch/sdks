// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { PeggedSwapArgs } from './pegged-swap-args'
import { PeggedSwapArgsCoder } from './pegged-swap-args-coder'
import type { PeggedTokenInfo } from './types'

describe('PeggedSwapArgs', () => {
  const coder = new PeggedSwapArgsCoder()

  it('should encode and decode pegged swap args', () => {
    const x0 = 10_000n * 10n ** 18n
    const y0 = 10_000n * 10n ** 18n
    const linearWidth = 8n * 10n ** 26n
    const rateLt = 10n ** 12n
    const rateGt = 1n
    const args = new PeggedSwapArgs(x0, y0, linearWidth, rateLt, rateGt)

    const encoded = PeggedSwapArgs.CODER.encode(args)
    expect(encoded.bytesCount()).toBe(160)

    const decoded = PeggedSwapArgs.decode(encoded)

    expect(decoded.x0).toBe(x0)
    expect(decoded.y0).toBe(y0)
    expect(decoded.linearWidth).toBe(linearWidth)
    expect(decoded.rateLt).toBe(rateLt)
    expect(decoded.rateGt).toBe(rateGt)
  })

  it('should handle maximum uint256 values for reserves and rates', () => {
    const maxUint256 = (1n << 256n) - 1n
    const maxLinearWidth = 5000n * 10n ** 27n
    const args = new PeggedSwapArgs(maxUint256, maxUint256, maxLinearWidth, maxUint256, maxUint256)

    const encoded = PeggedSwapArgs.CODER.encode(args)
    const decoded = PeggedSwapArgs.decode(encoded)

    expect(decoded.x0).toBe(maxUint256)
    expect(decoded.y0).toBe(maxUint256)
    expect(decoded.linearWidth).toBe(maxLinearWidth)
    expect(decoded.rateLt).toBe(maxUint256)
    expect(decoded.rateGt).toBe(maxUint256)
  })

  it('should throw when x0 or y0 is zero', () => {
    expect(() => new PeggedSwapArgs(0n, 1n, 1n, 1n, 1n)).toThrow('Reserves cannot be zero')
    expect(() => new PeggedSwapArgs(1n, 0n, 1n, 1n, 1n)).toThrow('Reserves cannot be zero')
  })

  it('should throw when rateLt or rateGt is zero or invalid', () => {
    expect(() => new PeggedSwapArgs(1n, 1n, 1n, 0n, 1n)).toThrow(/Invalid rateLt/)
    expect(() => new PeggedSwapArgs(1n, 1n, 1n, 1n, 0n)).toThrow(/Invalid rateGt/)
  })

  it('should throw when linearWidth exceeds 5000e27', () => {
    const tooLarge = 5000n * 10n ** 27n + 1n
    expect(() => new PeggedSwapArgs(1n, 1n, tooLarge, 1n, 1n)).toThrow(/Invalid linearWidth/)
  })

  it('should throw when x0 or y0 exceeds UINT_256_MAX', () => {
    const overflow = 1n << 256n
    expect(() => new PeggedSwapArgs(overflow, 1n, 1n, 1n, 1n)).toThrow(/Invalid x0/)
    expect(() => new PeggedSwapArgs(1n, overflow, 1n, 1n, 1n)).toThrow(/Invalid y0/)
  })

  it('should convert to JSON correctly', () => {
    const rateLt = 99n * 10n ** 16n
    const rateGt = 101n * 10n ** 16n
    const args = new PeggedSwapArgs(100n, 200n, 50n, rateLt, rateGt)
    const json = args.toJSON()
    expect(json).toEqual({
      x0: '100',
      y0: '200',
      linearWidth: '50',
      rateLt: '990000000000000000',
      rateGt: '1010000000000000000',
    })
  })

  it('should use static decode method', () => {
    const oneE18 = 10n ** 18n
    const args = new PeggedSwapArgs(42n, 43n, 10n, oneE18, oneE18)
    const encoded = PeggedSwapArgs.CODER.encode(args)
    const decoded = PeggedSwapArgs.decode(encoded)
    expect(decoded).toBeInstanceOf(PeggedSwapArgs)
    expect(decoded.x0).toBe(42n)
    expect(decoded.y0).toBe(43n)
    expect(decoded.linearWidth).toBe(10n)
    expect(decoded.rateLt).toBe(oneE18)
    expect(decoded.rateGt).toBe(oneE18)
  })

  it('should build fromTokens when tokenA has lower address (same decimals)', () => {
    const tokenA: PeggedTokenInfo = {
      address: new Address('0x0000000000000000000000000000000000000001'),
      decimals: 18,
      reserve: 1000n,
    }
    const tokenB: PeggedTokenInfo = {
      address: new Address('0x0000000000000000000000000000000000000002'),
      decimals: 18,
      reserve: 2000n,
    }
    const linearWidth = 8n * 10n ** 26n
    const args = PeggedSwapArgs.fromTokens(tokenA, tokenB, linearWidth)
    expect(args.x0).toBe(1000n)
    expect(args.y0).toBe(2000n)
    expect(args.linearWidth).toBe(linearWidth)
    expect(args.rateLt).toBe(1n)
    expect(args.rateGt).toBe(1n)
  })

  it('should build fromTokens when tokenB has lower address (same decimals)', () => {
    const tokenA: PeggedTokenInfo = {
      address: new Address('0x0000000000000000000000000000000000000002'),
      decimals: 18,
      reserve: 2000n,
    }
    const tokenB: PeggedTokenInfo = {
      address: new Address('0x0000000000000000000000000000000000000001'),
      decimals: 18,
      reserve: 1000n,
    }
    const linearWidth = 10n ** 27n
    const args = PeggedSwapArgs.fromTokens(tokenA, tokenB, linearWidth)
    expect(args.x0).toBe(1000n)
    expect(args.y0).toBe(2000n)
    expect(args.linearWidth).toBe(linearWidth)
    expect(args.rateLt).toBe(1n)
    expect(args.rateGt).toBe(1n)
  })

  it('should build fromTokens with 18 vs 6 decimals (rate scaling)', () => {
    const token18: PeggedTokenInfo = {
      address: new Address('0x0000000000000000000000000000000000000001'),
      decimals: 18,
      reserve: 10n ** 18n,
    }
    const token6: PeggedTokenInfo = {
      address: new Address('0x0000000000000000000000000000000000000002'),
      decimals: 6,
      reserve: 10n ** 6n,
    }
    const linearWidth = 5n * 10n ** 26n
    const args = PeggedSwapArgs.fromTokens(token18, token6, linearWidth)
    expect(args.x0).toBe(10n ** 18n)
    expect(args.y0).toBe(10n ** 6n * 10n ** 12n)
    expect(args.linearWidth).toBe(linearWidth)
    expect(args.rateLt).toBe(1n)
    expect(args.rateGt).toBe(10n ** 12n)
  })

  it('should decode from known hex (5 × 32-byte uints)', () => {
    // x0=1, y0=2, linearWidth=3, rateLt=4, rateGt=5 (each left-padded to 32 bytes)
    const hex =
      '0x' +
      '0000000000000000000000000000000000000000000000000000000000000001' +
      '0000000000000000000000000000000000000000000000000000000000000002' +
      '0000000000000000000000000000000000000000000000000000000000000003' +
      '0000000000000000000000000000000000000000000000000000000000000004' +
      '0000000000000000000000000000000000000000000000000000000000000005'
    const decoded = coder.decode(new HexString(hex))
    expect(decoded.x0).toBe(1n)
    expect(decoded.y0).toBe(2n)
    expect(decoded.linearWidth).toBe(3n)
    expect(decoded.rateLt).toBe(4n)
    expect(decoded.rateGt).toBe(5n)
  })

  it('should round-trip through coder', () => {
    const rateLt = 95n * 10n ** 16n
    const rateGt = 105n * 10n ** 16n
    const args = new PeggedSwapArgs(10n ** 18n, 2n * 10n ** 18n, 100000n, rateLt, rateGt)
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)
    expect(decoded.x0).toBe(args.x0)
    expect(decoded.y0).toBe(args.y0)
    expect(decoded.linearWidth).toBe(args.linearWidth)
    expect(decoded.rateLt).toBe(args.rateLt)
    expect(decoded.rateGt).toBe(args.rateGt)
  })
})
