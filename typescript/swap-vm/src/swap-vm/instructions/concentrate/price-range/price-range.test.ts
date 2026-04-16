// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { PriceRange } from './price-range'
import type { PriceBounds, TokenReserves } from './types'
import { Price } from '../price'
import type { PricePair } from '../price/types'
import { ONE_E18 } from '../concentrate-grow-liquidity-2d-args'
import { TokenReserve } from '../token-reserve'

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
/** Extra token for negative tests (not USDC/WETH). */
const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')

const pairUsdcQuoteWethBase: PricePair = {
  quoteToken: { address: USDC, decimals: 6n },
  baseToken: { address: WETH, decimals: 18n },
}

describe('PriceRange', () => {
  it('new should keep bound references when already in sqrt order', () => {
    const sqrtMinBound = Price.fromHuman('3000', pairUsdcQuoteWethBase)
    const spot = Price.fromHuman('2500', pairUsdcQuoteWethBase)
    const sqrtMaxBound = Price.fromHuman('2000', pairUsdcQuoteWethBase)

    const range = PriceRange.new({
      minPrice: sqrtMinBound,
      spotPrice: spot,
      maxPrice: sqrtMaxBound,
    })

    expect(range.minPrice).toBe(sqrtMinBound)
    expect(range.spotPrice).toBe(spot)
    expect(range.maxPrice).toBe(sqrtMaxBound)
  })

  it('new should normalize swapped min/max labels relative to spot (sqrt order)', () => {
    /** Higher USDC-per-WETH human quote => lower `sqrtP` on this pair. */
    const sqrtMinBound = Price.fromHuman('3000', pairUsdcQuoteWethBase)
    const spot = Price.fromHuman('2500', pairUsdcQuoteWethBase)
    const sqrtMaxBound = Price.fromHuman('2000', pairUsdcQuoteWethBase)

    const range = PriceRange.new({
      minPrice: sqrtMaxBound,
      spotPrice: spot,
      maxPrice: sqrtMinBound,
    })

    expect(range.minPrice.equals(sqrtMinBound)).toBe(true)
    expect(range.spotPrice.equals(spot)).toBe(true)
    expect(range.maxPrice.equals(sqrtMaxBound)).toBe(true)
  })

  it('toJSON should yield bigint-safe JSON', () => {
    const lowerHumanQuote = Price.fromHuman('2000', pairUsdcQuoteWethBase)
    const spotPrice = Price.fromHuman('2500', pairUsdcQuoteWethBase)
    const higherHumanQuote = Price.fromHuman('3000', pairUsdcQuoteWethBase)
    const range = PriceRange.new({
      minPrice: lowerHumanQuote,
      spotPrice,
      maxPrice: higherHumanQuote,
    })

    const json = range.toJSON()
    expect(json.minPrice.sqrtP).toBe(higherHumanQuote.toSqrt().toString())
    expect(json.maxPrice.sqrtP).toBe(lowerHumanQuote.toSqrt().toString())
    expect(JSON.stringify(range)).toBe(JSON.stringify(json))
  })

  it('fromJSON should round-trip toJSON', () => {
    const minPrice = Price.fromHuman('2000', pairUsdcQuoteWethBase)
    const spotPrice = Price.fromHuman('2500', pairUsdcQuoteWethBase)
    const maxPrice = Price.fromHuman('3000', pairUsdcQuoteWethBase)
    const range = PriceRange.new({ minPrice, spotPrice, maxPrice })

    expect(PriceRange.fromJSON(range.toJSON()).toJSON()).toEqual(range.toJSON())
  })

  it('new should throw when spot is below sqrt bounds', () => {
    const minPrice = Price.fromHuman('2000', pairUsdcQuoteWethBase)
    const spotPrice = Price.fromHuman('3500', pairUsdcQuoteWethBase)
    const maxPrice = Price.fromHuman('3000', pairUsdcQuoteWethBase)

    expect(() => PriceRange.new({ minPrice, spotPrice, maxPrice })).toThrow(
      'spotPrice should be >= minPrice',
    )
  })

  it('new should throw when min and max bounds collapse (spot outside)', () => {
    const low = Price.fromSqrt(9n * 10n ** 17n, {
      tokenA: pairUsdcQuoteWethBase.quoteToken,
      tokenB: pairUsdcQuoteWethBase.baseToken,
    })
    const high = Price.fromSqrt(11n * 10n ** 17n, {
      tokenA: pairUsdcQuoteWethBase.quoteToken,
      tokenB: pairUsdcQuoteWethBase.baseToken,
    })
    const spot = Price.fromSqrt(12n * 10n ** 17n, {
      tokenA: pairUsdcQuoteWethBase.quoteToken,
      tokenB: pairUsdcQuoteWethBase.baseToken,
    })

    expect(() => PriceRange.new({ minPrice: low, spotPrice: spot, maxPrice: high })).toThrow(
      'maxPrice should be >= spotPrice',
    )
  })

  it('new should throw when minPrice equals maxPrice', () => {
    const sqrt = 10n ** 18n
    const p = Price.fromSqrt(sqrt, {
      tokenA: pairUsdcQuoteWethBase.quoteToken,
      tokenB: pairUsdcQuoteWethBase.baseToken,
    })

    expect(() => PriceRange.new({ minPrice: p, spotPrice: p, maxPrice: p })).toThrow(
      'minPrice should be < maxPrice',
    )
  })

  describe('fromPriceBounds', () => {
    const sqrtPriceMin = 9n * 10n ** 17n
    const sqrtPriceMax = 11n * 10n ** 17n

    const bounds = (): PriceBounds => {
      const minPrice = Price.fromSqrt(sqrtPriceMin, {
        tokenA: pairUsdcQuoteWethBase.quoteToken,
        tokenB: pairUsdcQuoteWethBase.baseToken,
      })
      const maxPrice = Price.fromSqrt(sqrtPriceMax, {
        tokenA: pairUsdcQuoteWethBase.quoteToken,
        tokenB: pairUsdcQuoteWethBase.baseToken,
      })

      return { minPrice, maxPrice }
    }

    const reservesMatchingToken0Token1 = (): TokenReserves => {
      const { minPrice } = bounds()

      return {
        reserveA: TokenReserve.new({ token: minPrice.token0.address, reserve: 1000n * ONE_E18 }),
        reserveB: TokenReserve.new({ token: minPrice.token1.address, reserve: 500n * ONE_E18 }),
      }
    }

    it('should match computeLiquidityAndPrice spot for known reserves (reserveA = token0)', () => {
      const { minPrice, maxPrice } = bounds()
      const reserves = reservesMatchingToken0Token1()

      const range = PriceRange.fromPriceBounds({ minPrice, maxPrice }, reserves)

      expect(range.minPrice.equals(minPrice)).toBe(true)
      expect(range.maxPrice.equals(maxPrice)).toBe(true)
      expect(range.spotPrice.toSqrt()).toBe(964082408958572419n)
    })

    it('should accept the same reserves when reserveA is token1 and reserveB is token0', () => {
      const { minPrice, maxPrice } = bounds()
      const ordered = reservesMatchingToken0Token1()

      const range = PriceRange.fromPriceBounds(
        { minPrice, maxPrice },
        { reserveA: ordered.reserveB, reserveB: ordered.reserveA },
      )

      expect(range.spotPrice.toSqrt()).toBe(964082408958572419n)
    })

    it('should normalize swapped bound labels (minPrice field has higher sqrt than maxPrice field)', () => {
      const { minPrice, maxPrice } = bounds()
      const reserves = reservesMatchingToken0Token1()

      const range = PriceRange.fromPriceBounds({ minPrice: maxPrice, maxPrice: minPrice }, reserves)

      expect(range.minPrice.equals(minPrice)).toBe(true)
      expect(range.maxPrice.equals(maxPrice)).toBe(true)
      expect(range.spotPrice.toSqrt()).toBe(964082408958572419n)
    })

    it('should throw when a reserve token does not match the pair', () => {
      const { minPrice, maxPrice } = bounds()

      expect(() =>
        PriceRange.fromPriceBounds(
          { minPrice, maxPrice },
          {
            reserveA: TokenReserve.new({ token: DAI, reserve: 1000n * ONE_E18 }),
            reserveB: TokenReserve.new({ token: WETH, reserve: 500n * ONE_E18 }),
          },
        ),
      ).toThrow('provided reserve for unknown token')
    })
  })
})
