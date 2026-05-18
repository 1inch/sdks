// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { Price } from './price'
import type { PricePair } from './types'

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const MUSD = new Address('0xe2f2a5c287993345a840db3b0845fbc70f5935a5')
const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

const pairUsdcQuoteWethBase: PricePair = {
  quoteToken: { address: USDC, decimals: 6n },
  baseToken: { address: WETH, decimals: 18n },
}

const pairWethQuoteUsdcBase: PricePair = {
  quoteToken: { address: WETH, decimals: 18n },
  baseToken: { address: USDC, decimals: 6n },
}

/** Same 18-decimal layout as in pool tests (WETH / MUSD). */
const pairMusdQuoteWethBase: PricePair = {
  quoteToken: { address: MUSD, decimals: 18n },
  baseToken: { address: WETH, decimals: 18n },
}

const pairWethQuoteMusdBase: PricePair = {
  quoteToken: { address: WETH, decimals: 18n },
  baseToken: { address: MUSD, decimals: 18n },
}

describe('Price', () => {
  it('fromSqrt should match known allocation spot sqrt', () => {
    const sqrt = 20000000000000000000000n
    const p = Price.fromSqrt(sqrt, {
      tokenA: pairUsdcQuoteWethBase.quoteToken,
      tokenB: pairUsdcQuoteWethBase.baseToken,
    })

    expect(p.toSqrt()).toBe(sqrt)
  })

  it('toJSON should yield bigint-safe JSON', () => {
    const sqrt = 20000000000000000000000n
    const p = Price.fromSqrt(sqrt, {
      tokenA: pairUsdcQuoteWethBase.quoteToken,
      tokenB: pairUsdcQuoteWethBase.baseToken,
    })

    const json = p.toJSON()
    expect(json.sqrtP).toBe('20000000000000000000000')
    expect(json.token0.decimals).toBe('6')
    expect(json.token1.decimals).toBe('18')
    expect(JSON.stringify(p)).toBe(JSON.stringify(json))
  })

  it('fromJSON should round-trip toJSON', () => {
    const sqrt = 20000000000000000000000n
    const p = Price.fromSqrt(sqrt, {
      tokenA: pairUsdcQuoteWethBase.quoteToken,
      tokenB: pairUsdcQuoteWethBase.baseToken,
    })

    expect(Price.fromJSON(p.toJSON()).equals(p)).toBe(true)
  })

  it('fromJSON should require canonical token0 < token1 order', () => {
    const p = Price.fromSqrt(20000000000000000000000n, {
      tokenA: pairUsdcQuoteWethBase.quoteToken,
      tokenB: pairUsdcQuoteWethBase.baseToken,
    })
    const json = p.toJSON()
    const bad = {
      ...json,
      token0: json.token1,
      token1: json.token0,
    }

    expect(() => Price.fromJSON(bad)).toThrow('token0 address must be less than token1')
  })

  it('should throw if quote and base are the same token', () => {
    expect(() =>
      Price.fromHuman('1', {
        quoteToken: pairUsdcQuoteWethBase.quoteToken,
        baseToken: pairUsdcQuoteWethBase.quoteToken,
      }),
    ).toThrow('quote and base must be different tokens')
  })

  it('should round-trip toHuman / fromHuman (USDC quote, WETH base)', () => {
    const p = Price.fromHuman('2500', pairUsdcQuoteWethBase)

    expect(p.toHuman(USDC)).toBe('2500')
  })

  it('fromHuman should match fromSqrt for USDC quote spot', () => {
    const sqrt = 20000000000000000000000n
    const a = Price.fromHuman('2500', pairUsdcQuoteWethBase)
    const b = Price.fromSqrt(sqrt, {
      tokenA: pairUsdcQuoteWethBase.quoteToken,
      tokenB: pairUsdcQuoteWethBase.baseToken,
    })

    expect(a.equals(b)).toBe(true)
  })

  it('should round-trip toHuman / fromHuman (WETH quote, USDC base)', () => {
    const p = Price.fromHuman('0.0004', pairWethQuoteUsdcBase)
    const q = Price.fromHuman(p.toHuman(WETH), pairWethQuoteUsdcBase)

    expect(p.equals(q)).toBe(true)
  })

  it('should ensure correct spot prices for human prices for usdc quote and weth base', () => {
    const p1 = Price.fromHuman('2000', pairUsdcQuoteWethBase)
    expect(p1.toSqrt()).toBe(22360679774997896964091n)
    expect(p1.toRaw()).toBe(499999999999999999999967054n)
    expect(p1.toHuman(USDC)).toBe('2000')
    expect(p1.toHuman(WETH)).toBe('0.0005')

    const p2 = Price.fromHuman('2500', pairUsdcQuoteWethBase)
    expect(p2.toSqrt()).toBe(20000000000000000000000n)
    expect(p2.toRaw()).toBe(400000000000000000000000000n)
    expect(p2.toHuman(USDC)).toBe('2500')
    expect(p2.toHuman(WETH)).toBe('0.0004')

    const p3 = Price.fromHuman('3000', pairUsdcQuoteWethBase)
    expect(p3.toSqrt()).toBe(18257418583505537115232n)
    expect(p3.toRaw()).toBe(333333333333333333333321426n)
    expect(p3.toHuman(USDC)).toBe('3000')
    expect(p3.toHuman(WETH)).toBe('0.000333333333333333')
  })

  it('should ensure correct spot prices for human prices for usdc base and weth quote', () => {
    const p1 = Price.fromHuman('0.000499999999999999', pairWethQuoteUsdcBase)
    expect(p1.toSqrt()).toBe(22360679774997874603411n)
    expect(p1.toRaw()).toBe(499999999999998999999956991n)
    expect(p1.toHuman(USDC)).toBe('2000')
    expect(p1.toHuman(WETH)).toBe('0.000499999999999999')

    const p2 = Price.fromHuman('0.0004', pairWethQuoteUsdcBase)
    expect(p2.toSqrt()).toBe(20000000000000000000000n)
    expect(p2.toRaw()).toBe(400000000000000000000000000n)
    expect(p2.toHuman(USDC)).toBe('2500')
    expect(p2.toHuman(WETH)).toBe('0.0004')

    const p3 = Price.fromHuman('0.000333333333333333', pairWethQuoteUsdcBase)
    expect(p3.toSqrt()).toBe(18257418583505527986523n)
    expect(p3.toRaw()).toBe(333333333333332999999998746n)
    expect(p3.toHuman(USDC)).toBe('3000')
    expect(p3.toHuman(WETH)).toBe('0.000333333333333333')
  })

  it('should ensure correct spot prices for human prices for musd quote and weth base', () => {
    const p1 = Price.fromHuman('2000', pairMusdQuoteWethBase)
    expect(p1.toSqrt()).toBe(44721359549995793928n)
    expect(p1.toRaw()).toBe(1999999999999999999983n)
    expect(p1.toHuman(MUSD)).toBe('1999.999999999999999984')
    expect(p1.toHuman(WETH)).toBe('0.0005')

    const p2 = Price.fromHuman('2500', pairMusdQuoteWethBase)
    expect(p2.toSqrt()).toBe(50000000000000000000n)
    expect(p2.toRaw()).toBe(2500000000000000000000n)
    expect(p2.toHuman(MUSD)).toBe('2500')
    expect(p2.toHuman(WETH)).toBe('0.0004')

    const p3 = Price.fromHuman('3000', pairMusdQuoteWethBase)
    expect(p3.toSqrt()).toBe(54772255750516611345n)
    expect(p3.toRaw()).toBe(2999999999999999999923n)
    expect(p3.toHuman(MUSD)).toBe('2999.999999999999999924')
    expect(p3.toHuman(WETH)).toBe('0.000333333333333333')
  })

  it('should ensure correct spot prices for human prices for musd base and weth quote', () => {
    const p1 = Price.fromHuman('0.000499999999999999', pairWethQuoteMusdBase)
    expect(p1.toSqrt()).toBe(44721359549995838649n)
    expect(p1.toRaw()).toBe(2000000000000003999951n)
    expect(p1.toHuman(MUSD)).toBe('2000.000000000003999951')
    expect(p1.toHuman(WETH)).toBe('0.000499999999999999')

    const p2 = Price.fromHuman('0.0004', pairWethQuoteMusdBase)
    expect(p2.toSqrt()).toBe(50000000000000000000n)
    expect(p2.toRaw()).toBe(2500000000000000000000n)
    expect(p2.toHuman(MUSD)).toBe('2500')
    expect(p2.toHuman(WETH)).toBe('0.0004')

    const p3 = Price.fromHuman('0.000333333333333333', pairWethQuoteMusdBase)
    expect(p3.toSqrt()).toBe(54772255750516638731n)
    expect(p3.toRaw()).toBe(3000000000000002999909n)
    expect(p3.toHuman(MUSD)).toBe('3000.00000000000299991')
    expect(p3.toHuman(WETH)).toBe('0.000333333333333333')
  })
})
