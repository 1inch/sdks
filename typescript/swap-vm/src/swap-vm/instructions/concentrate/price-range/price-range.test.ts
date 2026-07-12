// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { PriceRange } from './price-range'
import type { PriceAllocationRange, PriceBounds, TokenReserves } from './types'
import { Price } from '../price'
import type { PricePair, PriceToken } from '../price/types'
import { ONE_E18 } from '../concentrate-grow-liquidity-2d-args'
import { TokenReserve } from '../token-reserve'

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
const MUSD = new Address('0xe2f2a5c287993345a840db3b0845fbc70f5935a5')
/** Extra token for negative tests (not USDC/WETH). */
const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')

const USDC_TOKEN: PriceToken = { address: USDC, decimals: 6n }
const WETH_TOKEN: PriceToken = { address: WETH, decimals: 18n }
const MUSD_TOKEN: PriceToken = { address: MUSD, decimals: 18n }

function pricePair(quote: PriceToken, base: PriceToken): PricePair {
  return { quoteToken: quote, baseToken: base }
}

/** {@link Price.fromSqrt} expects `tokenA`/`tokenB`; a {@link PricePair} is quote/base in the same order. */
function sqrtTokens(pair: PricePair): { tokenA: PriceToken; tokenB: PriceToken } {
  return { tokenA: pair.quoteToken, tokenB: pair.baseToken }
}

const pairUsdcQuoteWethBase = pricePair(USDC_TOKEN, WETH_TOKEN)
const pairWethQuoteUsdcBase = pricePair(WETH_TOKEN, USDC_TOKEN)
const pairMusdQuoteWethBase = pricePair(MUSD_TOKEN, WETH_TOKEN)
const pairWethQuoteMusdBase = pricePair(WETH_TOKEN, MUSD_TOKEN)

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
    const low = Price.fromSqrt(9n * 10n ** 17n, sqrtTokens(pairUsdcQuoteWethBase))
    const high = Price.fromSqrt(11n * 10n ** 17n, sqrtTokens(pairUsdcQuoteWethBase))
    const spot = Price.fromSqrt(12n * 10n ** 17n, sqrtTokens(pairUsdcQuoteWethBase))

    expect(() => PriceRange.new({ minPrice: low, spotPrice: spot, maxPrice: high })).toThrow(
      'maxPrice should be >= spotPrice',
    )
  })

  it('new should throw when minPrice equals maxPrice', () => {
    const sqrt = 10n ** 18n
    const p = Price.fromSqrt(sqrt, sqrtTokens(pairUsdcQuoteWethBase))

    expect(() => PriceRange.new({ minPrice: p, spotPrice: p, maxPrice: p })).toThrow(
      'minPrice should be < maxPrice',
    )
  })

  describe('token0 / token1', () => {
    it('should expose token0 as lower address and token1 as higher', () => {
      const pair = pairUsdcQuoteWethBase
      /** Ascending sqrt(P): for USDC quote, human 3000 / 2500 / 2000 USDC per WETH (not numeric order). */
      const range = PriceRange.new({
        minPrice: Price.fromHuman('3000', pair),
        spotPrice: Price.fromHuman('2500', pair),
        maxPrice: Price.fromHuman('2000', pair),
      })

      expect(range.token0.address.toString()).toBe(USDC.toString().toLowerCase())
      expect(range.token1.address.toString()).toBe(WETH.toString().toLowerCase())
      expect(
        BigInt(range.token0.address.toString()) < BigInt(range.token1.address.toString()),
      ).toBe(true)
    })

    it('should match canonical token0/token1 regardless of quote/base orientation in fromHuman', () => {
      const pair = pairWethQuoteUsdcBase
      /** Same curve as 3000 / 2500 / 2000 USDC per 1 WETH, expressed as WETH per 1 USDC. */
      const range = PriceRange.new({
        minPrice: Price.fromHuman('0.000333333333333333', pair),
        spotPrice: Price.fromHuman('0.0004', pair),
        maxPrice: Price.fromHuman('0.0005', pair),
      })

      expect(range.token0.address.toString()).toBe(USDC.toString().toLowerCase())
      expect(range.token1.address.toString()).toBe(WETH.toString().toLowerCase())
    })
  })

  describe('computeMaxAllocation', () => {
    const maxUsdc = 1_000_000n * 10n ** 6n
    const maxWeth = 400n * 10n ** 18n

    const maxReservesUsdcWeth = (): TokenReserves => ({
      reserveA: TokenReserve.new({ token: USDC, reserve: maxUsdc }),
      reserveB: TokenReserve.new({ token: WETH, reserve: maxWeth }),
    })

    it('should return reserves when quote is token0 (USDC)', () => {
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('2000', pairUsdcQuoteWethBase),
        spotPrice: Price.fromHuman('2500', pairUsdcQuoteWethBase),
        maxPrice: Price.fromHuman('3000', pairUsdcQuoteWethBase),
      }

      const range = PriceRange.new(prices)
      const result = range.computeMaxAllocation(maxReservesUsdcWeth())

      expect(result.reserve0.reserve).toBe(999999999999n)
      expect(result.reserve1.reserve).toBe(330119361793825978647n)
    })

    it('should return same allocation when quote is token1 (WETH)', () => {
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('0.000333333333333333', pairWethQuoteUsdcBase),
        spotPrice: Price.fromHuman('0.0004', pairWethQuoteUsdcBase),
        maxPrice: Price.fromHuman('0.0005', pairWethQuoteUsdcBase),
      }

      const range = PriceRange.new(prices)
      const result = range.computeMaxAllocation(maxReservesUsdcWeth())

      expect(result.reserve0.reserve).toBe(999999999999n)
      expect(result.reserve1.reserve).toBe(330119361793827708014n)
    })
  })

  describe('computeFixedAllocation', () => {
    it('should compute reserves when token0 (USDC) amount is fixed', () => {
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('2000', pairUsdcQuoteWethBase),
        spotPrice: Price.fromHuman('2500', pairUsdcQuoteWethBase),
        maxPrice: Price.fromHuman('3000', pairUsdcQuoteWethBase),
      }
      const range = PriceRange.new(prices)
      const fixedUsdc = 1_000_000n * 10n ** 6n

      const result = range.computeFixedAllocation(
        TokenReserve.new({ token: USDC, reserve: fixedUsdc }),
      )

      expect(result.reserve0.reserve).toBe(999999999999n)
      expect(result.reserve1.reserve).toBe(330119361793825978647n)
    })

    it('should compute reserves when token1 (WETH) amount is fixed', () => {
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('0.000333333333333333', pairWethQuoteUsdcBase),
        spotPrice: Price.fromHuman('0.0004', pairWethQuoteUsdcBase),
        maxPrice: Price.fromHuman('0.0005', pairWethQuoteUsdcBase),
      }
      const range = PriceRange.new(prices)
      const fixedWeth = 100n * 10n ** 18n

      const result = range.computeFixedAllocation(
        TokenReserve.new({ token: WETH, reserve: fixedWeth }),
      )

      expect(result.reserve0.reserve).toBe(302920735871n)
      expect(result.reserve1.reserve).toBe(99999999999999999914n)
    })
  })

  describe('WETH / MUSD (same decimals, 18)', () => {
    const maxWeth = 400n * 10n ** 18n
    const maxMUSD = 1_000_000n * 10n ** 18n

    it('should expose token0 (WETH) and token1 (MUSD) by address order', () => {
      const pair = pairMusdQuoteWethBase
      const range = PriceRange.new({
        minPrice: Price.fromHuman('2000', pair),
        spotPrice: Price.fromHuman('2500', pair),
        maxPrice: Price.fromHuman('3000', pair),
      })

      expect(range.token0.address.toString()).toBe(WETH.toString().toLowerCase())
      expect(range.token1.address.toString()).toBe(MUSD.toString().toLowerCase())
    })

    it('should compute max allocation when quote is token1 (MUSD)', () => {
      const pair = pairMusdQuoteWethBase
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('2000', pair),
        spotPrice: Price.fromHuman('2500', pair),
        maxPrice: Price.fromHuman('3000', pair),
      }

      const range = PriceRange.new(prices)
      const result = range.computeMaxAllocation({
        reserveA: TokenReserve.new({ token: MUSD, reserve: maxMUSD }),
        reserveB: TokenReserve.new({ token: WETH, reserve: maxWeth }),
      })

      expect(result.reserve0.reserve).toBe(330119361793825980083n)
      expect(result.reserve1.reserve).toBe(999999999999999999999998n)
    })

    it('should compute max allocation when quote is token0 (WETH)', () => {
      const pair = pairWethQuoteMusdBase
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('0.000333333333333333', pair),
        spotPrice: Price.fromHuman('0.0004', pair),
        maxPrice: Price.fromHuman('0.0005', pair),
      }

      const range = PriceRange.new(prices)
      const result = range.computeMaxAllocation({
        reserveA: TokenReserve.new({ token: WETH, reserve: maxWeth }),
        reserveB: TokenReserve.new({ token: MUSD, reserve: maxMUSD }),
      })

      expect(result.reserve0.reserve).toBe(330119361793827709443n)
      expect(result.reserve1.reserve).toBe(999999999999999999999998n)
    })

    it('should compute fixed allocation when token1 (MUSD) amount is fixed', () => {
      const pair = pairMusdQuoteWethBase
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('2000', pair),
        spotPrice: Price.fromHuman('2500', pair),
        maxPrice: Price.fromHuman('3000', pair),
      }
      const range = PriceRange.new(prices)
      const fixedMUSD = 100_000n * 10n ** 18n

      const result = range.computeFixedAllocation(
        TokenReserve.new({ token: MUSD, reserve: fixedMUSD }),
      )

      expect(result.reserve0.reserve).toBe(33011936179382598008n)
      expect(result.reserve1.reserve).toBe(99999999999999999999998n)
    })

    it('should compute fixed allocation when token0 (WETH) amount is fixed', () => {
      const pair = pairMusdQuoteWethBase
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('2000', pair),
        spotPrice: Price.fromHuman('2500', pair),
        maxPrice: Price.fromHuman('3000', pair),
      }
      const range = PriceRange.new(prices)
      const fixedWeth = 10n * 10n ** 18n

      const result = range.computeFixedAllocation(
        TokenReserve.new({ token: WETH, reserve: fixedWeth }),
      )

      expect(result.reserve0.reserve).toBe(9999999999999999999n)
      expect(result.reserve1.reserve).toBe(30292073587145241674914n)
    })
  })

  describe('fromPriceBounds', () => {
    const sqrtPriceMin = 9n * 10n ** 17n
    const sqrtPriceMax = 11n * 10n ** 17n

    const bounds = (): PriceBounds => {
      const minPrice = Price.fromSqrt(sqrtPriceMin, sqrtTokens(pairUsdcQuoteWethBase))
      const maxPrice = Price.fromSqrt(sqrtPriceMax, sqrtTokens(pairUsdcQuoteWethBase))

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

    describe('single-sided compositions (DAPP-4462 repro: WBTC 8dp / USDT 6dp)', () => {
      const WBTC = new Address('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599')
      const USDT = new Address('0xdAC17F958D2ee523a2206206994597C13D831ec7')

      /** WBTC has the lower address, so it is token0 and USDT is token1. */
      const WBTC_TOKEN: PriceToken = { address: WBTC, decimals: 8n }
      const USDT_TOKEN: PriceToken = { address: USDT, decimals: 6n }
      const pairUsdtQuoteWbtcBase = pricePair(USDT_TOKEN, WBTC_TOKEN)

      /** Range 58,946 -> 63,752 USDT per WBTC. */
      const wbtcUsdtBounds = (): PriceBounds => ({
        minPrice: Price.fromHuman('58946', pairUsdtQuoteWbtcBase),
        maxPrice: Price.fromHuman('63752', pairUsdtQuoteWbtcBase),
      })

      it('should place spot exactly at the min bound for token0-only reserves', () => {
        const { minPrice, maxPrice } = wbtcUsdtBounds()

        const range = PriceRange.fromPriceBounds(
          { minPrice, maxPrice },
          {
            /** 0.442142 WBTC */
            reserveA: TokenReserve.new({ token: WBTC, reserve: 44214200n }),
            reserveB: TokenReserve.new({ token: USDT, reserve: 0n }),
          },
        )

        expect(range.spotPrice.equals(range.minPrice)).toBe(true)
        expect(range.spotPrice.toHuman(USDT)).toBe('58946')
      })

      it('should place spot exactly at the max bound for token1-only reserves', () => {
        const { minPrice, maxPrice } = wbtcUsdtBounds()

        /**
         * Mirror of the min-side case above. In exact arithmetic the implied spot equals the
         * max bound (amount0 = 0), but deriving it via `computeLiquidityAndPrice` truncates
         * (`virtualLt = L / sqrtPmax` rounds down), landing the derived `sqrtSpot` ~3.4e-10
         * (relative) above `sqrtPmax` so the constructor assert used to reject this
         * legitimate single-sided composition with 'maxPrice should be >= spotPrice'.
         * Single-sided compositions now short-circuit to the corresponding bound.
         */
        const range = PriceRange.fromPriceBounds(
          { minPrice, maxPrice },
          {
            reserveA: TokenReserve.new({ token: WBTC, reserve: 0n }),
            /** 28,207 USDT */
            reserveB: TokenReserve.new({ token: USDT, reserve: 28_207_000_000n }),
          },
        )

        expect(range.spotPrice.equals(range.maxPrice)).toBe(true)
        expect(range.spotPrice.toHuman(USDT)).toBe('63752')
      })

      it('should throw when both reserves are zero', () => {
        const { minPrice, maxPrice } = wbtcUsdtBounds()

        expect(() =>
          PriceRange.fromPriceBounds(
            { minPrice, maxPrice },
            {
              reserveA: TokenReserve.new({ token: WBTC, reserve: 0n }),
              reserveB: TokenReserve.new({ token: USDT, reserve: 0n }),
            },
          ),
        ).toThrow('at least one reserve must be positive')
      })
    })

    describe('spot recovery after allocation', () => {
      const maxUsdc = 1_000_000n * 10n ** 6n
      const maxWeth = 400n * 10n ** 18n

      it('should match concentrate-liquidity-math given scaled bounds (quote token0)', () => {
        const pair = pairUsdcQuoteWethBase
        const prices: PriceAllocationRange = {
          minPrice: Price.fromHuman('3000', pair),
          spotPrice: Price.fromHuman('2500', pair),
          maxPrice: Price.fromHuman('2000', pair),
        }

        const range = PriceRange.new(prices)
        const allocation = range.computeMaxAllocation({
          reserveA: TokenReserve.new({ token: USDC, reserve: maxUsdc }),
          reserveB: TokenReserve.new({ token: WETH, reserve: maxWeth }),
        })
        const priceBounds: PriceBounds = {
          minPrice: prices.minPrice,
          maxPrice: prices.maxPrice,
        }

        const recovered = PriceRange.fromPriceBounds(priceBounds, {
          reserveA: allocation.reserve0,
          reserveB: allocation.reserve1,
        })

        expect(recovered.spotPrice.toSqrt()).toBe(20000000000001729646634n)
      })

      it('should match concentrate-liquidity-math given scaled bounds (quote token1)', () => {
        const pair = pairWethQuoteUsdcBase
        const prices: PriceAllocationRange = {
          minPrice: Price.fromHuman('0.000333333333333333', pair),
          spotPrice: Price.fromHuman('0.0004', pair),
          maxPrice: Price.fromHuman('0.0005', pair),
        }

        const range = PriceRange.new(prices)
        const allocation = range.computeMaxAllocation({
          reserveA: TokenReserve.new({ token: USDC, reserve: maxUsdc }),
          reserveB: TokenReserve.new({ token: WETH, reserve: maxWeth }),
        })
        const priceBounds: PriceBounds = {
          minPrice: prices.minPrice,
          maxPrice: prices.maxPrice,
        }

        const recovered = PriceRange.fromPriceBounds(priceBounds, {
          reserveA: allocation.reserve0,
          reserveB: allocation.reserve1,
        })

        expect(recovered.spotPrice.toSqrt()).toBe(20000000000001728634703n)
      })
    })
  })
})
