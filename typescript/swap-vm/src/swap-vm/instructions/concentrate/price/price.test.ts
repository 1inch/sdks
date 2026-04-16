// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { Price } from './price'

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

const tokenUsdc = { address: USDC, decimals: 6n }
const tokenWeth = { address: WETH, decimals: 18n }

describe('Price', () => {
  it('fromSqrt should match known allocation spot sqrt', () => {
    const sqrt = 20000000000000000000000n
    const p = Price.fromSqrt({
      sqrtP: sqrt,
      quoteToken: tokenUsdc,
      baseToken: tokenWeth,
    })

    expect(p.toSqrtFixed()).toBe(sqrt)
  })

  it('fromSqrt should recover same sqrt via toSqrtFixed for round numbers', () => {
    const sqrt = 20000000000000000000000n
    const p = Price.fromSqrt({
      sqrtP: sqrt,
      quoteToken: tokenUsdc,
      baseToken: tokenWeth,
    })

    expect(p.toSqrtFixed()).toBe(sqrt)
  })

  it('should throw if quote and base are the same token', () => {
    expect(() =>
      Price.fromSqrt({
        sqrtP: 1n,
        quoteToken: tokenUsdc,
        baseToken: tokenUsdc,
      }),
    ).toThrow('quote and base must be different tokens')
  })

  it('should round-trip toHuman / fromHuman (USDC quote, WETH base)', () => {
    const p = Price.fromHuman({
      price: '2500',
      quoteToken: tokenUsdc,
      baseToken: tokenWeth,
    })

    expect(p.toHuman()).toBe('2500')
  })

  it('fromHuman should match fromSqrt for USDC quote spot', () => {
    const sqrt = 20000000000000000000000n
    const a = Price.fromHuman({
      price: '2500',
      quoteToken: tokenUsdc,
      baseToken: tokenWeth,
    })
    const b = Price.fromSqrt({
      sqrtP: sqrt,
      quoteToken: tokenUsdc,
      baseToken: tokenWeth,
    })

    expect(a.equals(b)).toBe(true)
  })

  it('should round-trip toHuman / fromHuman (WETH quote, USDC base)', () => {
    const p = Price.fromHuman({
      price: '0.0004',
      quoteToken: tokenWeth,
      baseToken: tokenUsdc,
    })
    const q = Price.fromHuman({
      price: p.toHuman(),
      quoteToken: tokenWeth,
      baseToken: tokenUsdc,
    })

    expect(p.equals(q)).toBe(true)
  })
})
