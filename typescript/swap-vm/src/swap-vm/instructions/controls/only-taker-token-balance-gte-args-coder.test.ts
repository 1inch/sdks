// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { OnlyTakerTokenBalanceGteArgs } from './only-taker-token-balance-gte-args'
import { OnlyTakerTokenBalanceGteArgsCoder } from './only-taker-token-balance-gte-args-coder'

describe('OnlyTakerTokenBalanceGteArgsCoder', () => {
  const coder = new OnlyTakerTokenBalanceGteArgsCoder()
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

  it('should encode and decode args', () => {
    const minAmount = 1000000n * 10n ** 6n
    const args = new OnlyTakerTokenBalanceGteArgs(USDC, minAmount)

    const encoded = coder.encode(args)

    const hex = encoded.toString()
    expect(hex.substring(0, 42).toLowerCase()).toBe(USDC.toString())

    const decoded = coder.decode(encoded)
    expect(decoded.token.toString()).toBe(USDC.toString())
    expect(decoded.minAmount).toBe(minAmount)
  })

  it('should handle zero amount', () => {
    const args = new OnlyTakerTokenBalanceGteArgs(USDC, 0n)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.token.toString()).toBe(USDC.toString())
    expect(decoded.minAmount).toBe(0n)
  })

  it('should handle large amounts', () => {
    const maxUint256 = 2n ** 256n - 1n
    const args = new OnlyTakerTokenBalanceGteArgs(USDC, maxUint256)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.minAmount).toBe(maxUint256)
  })

  it('should use static decode method', () => {
    const args = new OnlyTakerTokenBalanceGteArgs(USDC, 12345n)
    const encoded = coder.encode(args)

    const decoded = OnlyTakerTokenBalanceGteArgs.decode(encoded)
    expect(decoded.token.toString()).toBe(USDC.toString())
    expect(decoded.minAmount).toBe(12345n)
  })

  it('should convert to JSON', () => {
    const args = new OnlyTakerTokenBalanceGteArgs(USDC, 999n)
    expect(args.toJSON()).toEqual({
      token: USDC.toString(),
      minAmount: '999',
    })
  })
})
