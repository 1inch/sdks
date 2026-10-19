// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address } from '@1inch/sdk-core'
import { ConcentrateGrowLiquidity2DArgs, ONE_E18 } from './concentrate-grow-liquidity-2d-args'
import { ConcentrateGrowLiquidity2DArgsCoder } from './concentrate-grow-liquidity-2d-args-coder'
import { Price } from './price'
import type { PricePair, PriceToken } from './price'
import { bigintSqrt } from '../utils/bigint-sqrt'

const USDC: PriceToken = {
  address: new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  decimals: 6n,
}
const WETH: PriceToken = {
  address: new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
  decimals: 18n,
}
const PEPE: PriceToken = {
  address: new Address('0x6982508145454Ce325dDbE47a25d4ec3d2311933'),
  decimals: 18n,
}
const DAI: PriceToken = {
  address: new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F'),
  decimals: 18n,
}

const usdcPerWeth: PricePair = { quoteToken: USDC, baseToken: WETH }
const usdcPerPepe: PricePair = { quoteToken: USDC, baseToken: PEPE }
const usdcPerDai: PricePair = { quoteToken: USDC, baseToken: DAI }

describe('ConcentrateGrowLiquidity2DArgs', () => {
  const coder = new ConcentrateGrowLiquidity2DArgsCoder()

  it('should encode and decode sqrtPriceMin and sqrtPriceMax', () => {
    const sqrtPriceMin = 9n * 10n ** 17n
    const sqrtPriceMax = 11n * 10n ** 17n
    const args = new ConcentrateGrowLiquidity2DArgs(sqrtPriceMin, sqrtPriceMax)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(130)

    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(sqrtPriceMax)
  })

  it('should enforce 0 < sqrtPriceMin < sqrtPriceMax', () => {
    expect(() => new ConcentrateGrowLiquidity2DArgs(0n, ONE_E18)).toThrow(/sqrtPriceMin/)
    expect(() => new ConcentrateGrowLiquidity2DArgs(ONE_E18, ONE_E18)).toThrow(
      /must be < sqrtPriceMax/,
    )
    expect(() => new ConcentrateGrowLiquidity2DArgs(2n * ONE_E18, ONE_E18)).toThrow(
      /must be < sqrtPriceMax/,
    )
  })

  it('should handle valid bounds', () => {
    const sqrtPriceMin = 1n
    const sqrtPriceMax = 2n ** 256n - 1n
    const args = new ConcentrateGrowLiquidity2DArgs(sqrtPriceMin, sqrtPriceMax)
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(sqrtPriceMax)
  })

  it('should use static decode method', () => {
    const args = new ConcentrateGrowLiquidity2DArgs(123n, 456n)
    const encoded = coder.encode(args)
    const decoded = ConcentrateGrowLiquidity2DArgs.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(123n)
    expect(decoded.sqrtPriceMax).toBe(456n)
  })

  it('should convert to JSON', () => {
    const args = new ConcentrateGrowLiquidity2DArgs(100n, 200n)
    const json = args.toJSON()
    expect(json).toEqual({
      sqrtPriceMin: '100',
      sqrtPriceMax: '200',
    })
  })

  it('should build from fromSqrtPrices', () => {
    const sqrtPriceMin = 9n * 10n ** 17n
    const sqrtPriceMax = 11n * 10n ** 17n
    const args = ConcentrateGrowLiquidity2DArgs.fromSqrtPrices(sqrtPriceMin, sqrtPriceMax)
    expect(args.sqrtPriceMin).toBe(sqrtPriceMin)
    expect(args.sqrtPriceMax).toBe(sqrtPriceMax)
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(sqrtPriceMax)
  })

  it('should build from fromRawPrices (P in 1e18: sqrt(P*1e18) = sqrt(P)*1e18)', () => {
    const rawPriceMin = ONE_E18
    const rawPriceMax = 4n * ONE_E18
    const args = ConcentrateGrowLiquidity2DArgs.fromRawPrices(rawPriceMin, rawPriceMax)
    expect(args.sqrtPriceMin).toBe(ONE_E18)
    expect(args.sqrtPriceMax).toBe(2n * ONE_E18)
  })

  it('should round-trip fromRawPrices through encode/decode', () => {
    const rawPriceMin = 2n * ONE_E18
    const rawPriceMax = 8n * ONE_E18
    const args = ConcentrateGrowLiquidity2DArgs.fromRawPrices(rawPriceMin, rawPriceMax)
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(args.sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(args.sqrtPriceMax)
  })

  it('example: USDC/WETH price range (P = tokenGt/tokenLt; USDC < WETH so P = WETH per USDC)', () => {
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    expect(BigInt(USDC) < BigInt(WETH)).toBe(true)

    const rawPriceMin = (ONE_E18 * ONE_E18) / (3000n * 10n ** 6n)
    const rawPriceMax = (ONE_E18 * ONE_E18) / (2000n * 10n ** 6n)

    const args = ConcentrateGrowLiquidity2DArgs.fromRawPrices(rawPriceMin, rawPriceMax)
    expect(args.sqrtPriceMin).toBeGreaterThan(0n)
    expect(args.sqrtPriceMax).toBeGreaterThan(args.sqrtPriceMin)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)
    expect(decoded.sqrtPriceMin).toBe(args.sqrtPriceMin)
    expect(decoded.sqrtPriceMax).toBe(args.sqrtPriceMax)
  })

  describe('fromPrices', () => {
    it('keeps the exact sqrt price when the raw price is tiny (PEPE/USDC)', () => {
      // PEPE < USDC, so P = raw USDC per raw PEPE: 0.00001 USDC per PEPE is 10 in 1e18 fixed-point
      const min = Price.fromHuman('0.00001', usdcPerPepe)
      const max = Price.fromHuman('0.00002', usdcPerPepe)

      const args = ConcentrateGrowLiquidity2DArgs.fromPrices(min, max)

      expect(args.sqrtPriceMin).toBe(bigintSqrt(10n * ONE_E18))
      expect(args.sqrtPriceMin).toBe(3162277660n)
      expect(args.sqrtPriceMax).toBe(bigintSqrt(20n * ONE_E18))
      expect(coder.decode(coder.encode(args)).sqrtPriceMin).toBe(3162277660n)
    })

    it('accepts the bounds in either order', () => {
      const p1500 = Price.fromHuman('1500', usdcPerWeth)
      const p3000 = Price.fromHuman('3000', usdcPerWeth)

      const args = ConcentrateGrowLiquidity2DArgs.fromPrices(p1500, p3000)

      // USDC < WETH, so P = WETH per USDC and 3000 USDC per WETH is the lower sqrt bound
      expect(args.sqrtPriceMin).toBe(p3000.toSqrt())
      expect(args.sqrtPriceMax).toBe(p1500.toSqrt())
      expect(ConcentrateGrowLiquidity2DArgs.fromPrices(p3000, p1500)).toEqual(args)
    })

    it('rejects bounds of different pairs', () => {
      expect(() =>
        ConcentrateGrowLiquidity2DArgs.fromPrices(
          Price.fromHuman('0.00001', usdcPerPepe),
          Price.fromHuman('2000', usdcPerWeth),
        ),
      ).toThrow('cannot compare prices for different pairs')
    })

    it('rejects equal bounds', () => {
      const price = Price.fromHuman('2000', usdcPerWeth)

      expect(() => ConcentrateGrowLiquidity2DArgs.fromPrices(price, price)).toThrow(
        /must be < sqrtPriceMax/,
      )
    })
  })

  describe('fromRawPrices precision floor', () => {
    const { MIN_RAW_PRICE } = ConcentrateGrowLiquidity2DArgs

    it('rejects raw prices too small for 1e18 fixed-point', () => {
      // toRaw() of 0.00001 USDC per PEPE is 9 instead of 10: as a bound it would encode sqrt 3e9
      // (a 10% lower price) instead of 3162277660
      const lossyRaw = Price.fromHuman('0.00001', usdcPerPepe).toRaw()
      expect(lossyRaw).toBe(9n)

      expect(() => ConcentrateGrowLiquidity2DArgs.fromRawPrices(lossyRaw, ONE_E18)).toThrow(
        'Invalid rawPriceMin: 9. Must be >= 100000 for 1e-5 precision; use sqrt prices instead',
      )
      expect(() =>
        ConcentrateGrowLiquidity2DArgs.fromRawPrices(MIN_RAW_PRICE - 1n, ONE_E18),
      ).toThrow(/Invalid rawPriceMin/)
      expect(() => ConcentrateGrowLiquidity2DArgs.fromRawPrices(0n, ONE_E18)).toThrow(
        /Invalid rawPriceMin/,
      )
      expect(() =>
        ConcentrateGrowLiquidity2DArgs.fromRawPrices(ONE_E18, MIN_RAW_PRICE - 1n),
      ).toThrow(/Invalid rawPriceMax/)
    })

    it('accepts raw prices from the floor up', () => {
      expect(MIN_RAW_PRICE).toBe(10n ** 5n)

      const args = ConcentrateGrowLiquidity2DArgs.fromRawPrices(MIN_RAW_PRICE, ONE_E18)
      expect(args.sqrtPriceMin).toBe(bigintSqrt(MIN_RAW_PRICE * ONE_E18))
    })

    it('matches the exact sqrt price for realistic magnitudes', () => {
      // USDC/WETH: raw prices around 3e26
      const rawPriceMin = (ONE_E18 * ONE_E18) / (3000n * 10n ** 6n)
      const rawPriceMax = (ONE_E18 * ONE_E18) / (1500n * 10n ** 6n)
      const wethArgs = ConcentrateGrowLiquidity2DArgs.fromRawPrices(rawPriceMin, rawPriceMax)

      expect(rawPriceMin).toBe(333333333333333333333333333n)
      expect(wethArgs.sqrtPriceMin).toBe(Price.fromHuman('3000', usdcPerWeth).toSqrt())
      expect(wethArgs.sqrtPriceMax).toBe(Price.fromHuman('1500', usdcPerWeth).toSqrt())

      // DAI (18 decimals) < USDC (6 decimals): raw prices around 1e6, e.g. 0.999-1.001 USDC per DAI
      const daiArgs = ConcentrateGrowLiquidity2DArgs.fromRawPrices(999_000n, 1_001_000n)

      expect(daiArgs.sqrtPriceMin).toBe(Price.fromHuman('0.999', usdcPerDai).toSqrt())
      expect(daiArgs.sqrtPriceMax).toBe(Price.fromHuman('1.001', usdcPerDai).toSqrt())
    })
  })
})
