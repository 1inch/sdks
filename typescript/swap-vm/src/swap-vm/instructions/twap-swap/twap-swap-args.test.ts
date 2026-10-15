// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { TWAPSwapArgs } from './twap-swap-args'

describe('TWAPSwapArgs', () => {
  it('should encode and decode TWAP swap args', () => {
    const balanceIn = 3000n * 10n ** 6n
    const balanceOut = 1n * 10n ** 18n
    const startTime = 1700000000n
    const duration = 86400n
    const priceBumpAfterIlliquidity = 1100000000000000000n
    const minTradeAmountOut = 10n ** 16n

    const args = new TWAPSwapArgs(
      balanceIn,
      balanceOut,
      startTime,
      duration,
      priceBumpAfterIlliquidity,
      minTradeAmountOut,
    )

    const encoded = TWAPSwapArgs.CODER.encode(args)
    const decoded = TWAPSwapArgs.decode(encoded)

    expect(decoded.balanceIn).toBe(balanceIn)
    expect(decoded.balanceOut).toBe(balanceOut)
    expect(decoded.startTime).toBe(startTime)
    expect(decoded.duration).toBe(duration)
    expect(decoded.priceBumpAfterIlliquidity).toBe(priceBumpAfterIlliquidity)
    expect(decoded.minTradeAmountOut).toBe(minTradeAmountOut)
  })

  it('should handle large uint256 values', () => {
    const largeValue = 10n ** 30n

    const args = new TWAPSwapArgs(
      largeValue,
      largeValue,
      largeValue,
      largeValue,
      largeValue,
      largeValue,
    )

    const encoded = TWAPSwapArgs.CODER.encode(args)
    const decoded = TWAPSwapArgs.decode(encoded)

    expect(decoded.balanceIn).toBe(largeValue)
    expect(decoded.balanceOut).toBe(largeValue)
    expect(decoded.startTime).toBe(largeValue)
    expect(decoded.duration).toBe(largeValue)
    expect(decoded.priceBumpAfterIlliquidity).toBe(largeValue)
    expect(decoded.minTradeAmountOut).toBe(largeValue)
  })

  it('should convert to JSON correctly', () => {
    const args = new TWAPSwapArgs(
      3000n * 10n ** 6n,
      1n * 10n ** 18n,
      1700000000n,
      86400n,
      1100000000000000000n,
      10n ** 16n,
    )
    const json = args.toJSON()

    expect(json).toEqual({
      balanceIn: '3000000000',
      balanceOut: '1000000000000000000',
      startTime: '1700000000',
      duration: '86400',
      priceBumpAfterIlliquidity: '1100000000000000000',
      minTradeAmountOut: '10000000000000000',
    })
  })

  it('should handle minimal executable values', () => {
    const args = new TWAPSwapArgs(1n, 1n, 0n, 1n, 10n ** 18n, 0n)

    const encoded = TWAPSwapArgs.CODER.encode(args)
    const decoded = TWAPSwapArgs.decode(encoded)

    expect(decoded.balanceIn).toBe(1n)
    expect(decoded.balanceOut).toBe(1n)
    expect(decoded.startTime).toBe(0n)
    expect(decoded.duration).toBe(1n)
    expect(decoded.priceBumpAfterIlliquidity).toBe(10n ** 18n)
    expect(decoded.minTradeAmountOut).toBe(0n)
  })

  describe('validation', () => {
    const params = {
      balanceIn: 3000n * 10n ** 6n,
      balanceOut: 1n * 10n ** 18n,
      startTime: 1700000000n,
      duration: 86400n,
      priceBumpAfterIlliquidity: 1100000000000000000n,
      minTradeAmountOut: 10n ** 16n,
    }

    const create = (overrides: Partial<typeof params>): TWAPSwapArgs => {
      const p = { ...params, ...overrides }

      return new TWAPSwapArgs(
        p.balanceIn,
        p.balanceOut,
        p.startTime,
        p.duration,
        p.priceBumpAfterIlliquidity,
        p.minTradeAmountOut,
      )
    }

    const encodeWords = (words: bigint[]): HexString =>
      new HexString('0x' + words.map((word) => word.toString(16).padStart(64, '0')).join(''))

    it('should reject zero balanceIn, balanceOut and duration', () => {
      expect(() => create({ balanceIn: 0n })).toThrow('Invalid balanceIn: 0. Must be > 0')
      expect(() => create({ balanceOut: 0n })).toThrow('Invalid balanceOut: 0. Must be > 0')
      expect(() => create({ duration: 0n })).toThrow('Invalid duration: 0. Must be > 0')
    })

    it('should reject priceBumpAfterIlliquidity below 1e18', () => {
      expect(() => create({ priceBumpAfterIlliquidity: 10n ** 18n - 1n })).toThrow(
        'Invalid priceBumpAfterIlliquidity: 999999999999999999. Must be >= 1e18',
      )
      expect(() => create({ priceBumpAfterIlliquidity: 0n })).toThrow(
        'Invalid priceBumpAfterIlliquidity: 0. Must be >= 1e18',
      )
    })

    it('should keep rejecting values outside the uint256 range', () => {
      expect(() => create({ startTime: -1n })).toThrow(
        'Invalid startTime: -1. Must be >= 0 and <= UINT_256_MAX',
      )
      expect(() => create({ minTradeAmountOut: 1n << 256n })).toThrow('Invalid minTradeAmountOut')
      expect(() => create({ duration: 1n << 256n })).toThrow('Invalid duration')
    })

    it('should reject non-executable args when decoding', () => {
      expect(() => TWAPSwapArgs.decode(encodeWords([0n, 0n, 0n, 0n, 0n, 0n]))).toThrow(
        'Invalid balanceIn: 0. Must be > 0',
      )
      expect(() => TWAPSwapArgs.decode(encodeWords([1n, 1n, 0n, 0n, 10n ** 18n, 0n]))).toThrow(
        'Invalid duration: 0. Must be > 0',
      )
      expect(() => TWAPSwapArgs.decode(encodeWords([1n, 1n, 0n, 1n, 10n ** 18n - 1n, 0n]))).toThrow(
        'Invalid priceBumpAfterIlliquidity',
      )
    })
  })

  it('should handle realistic TWAP scenarios', () => {
    const args = new TWAPSwapArgs(
      100n * 10n ** 18n,
      300000n * 10n ** 6n,
      1761840244n,
      604800n,
      1050000000000000000n,
      10n ** 17n,
    )

    const encoded = TWAPSwapArgs.CODER.encode(args)
    const decoded = TWAPSwapArgs.decode(encoded)

    expect(decoded.balanceIn).toBe(args.balanceIn)
    expect(decoded.balanceOut).toBe(args.balanceOut)
    expect(decoded.priceBumpAfterIlliquidity).toBe(1050000000000000000n)
  })
})
