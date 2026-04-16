// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { formatUnits } from 'viem'
import { ConcentrateLiquidityCalculator } from './concentrate-liquidity-calculator'
import type { ConcentrateTokenInfo, PriceAllocationRange, PriceBounds } from './types'
import { Price } from '../price'
import type { PricePair, PriceToken } from '../price/types'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const MUSD_ADDRESS = '0xe2f2a5c287993345a840db3b0845fbc70f5935a5'

function tokenInfo(address: string, decimals: number, maxAvailable: bigint): ConcentrateTokenInfo {
  return {
    address: new Address(address),
    decimals: BigInt(decimals),
    maxAvailableLiquidity: maxAvailable,
  }
}

function pricePair(quote: ConcentrateTokenInfo, base: ConcentrateTokenInfo): PricePair {
  return {
    quoteToken: { address: quote.address, decimals: quote.decimals },
    baseToken: { address: base.address, decimals: base.decimals },
  }
}

function tokenAB(a: ConcentrateTokenInfo, b: ConcentrateTokenInfo): { tokenA: PriceToken; tokenB: PriceToken } {
  return {
    tokenA: { address: a.address, decimals: a.decimals },
    tokenB: { address: b.address, decimals: b.decimals },
  }
}

/**
 * Min / spot / max in **ascending sqrt(P)** order for the usual ~2000–3000 quote-per-base
 * range. When quote is token0 (e.g. USDC vs WETH), {@link Price.fromHuman} is not monotone in
 * sqrt, so tests use explicit sqrt triples instead of three human strings.
 */
const USDC_WETH_SQRT_RANGE = {
  min: 18257418583505537115232n,
  spot: 20000000000000000000000n,
  max: 22360679774997896964091n,
} as const

/** Ascending sqrt range matching ~2000–3000 MUSD per WETH when quote is token0 (WETH). */
const WETH_MUSD_SQRT_RANGE = {
  min: 44721359549995793928n,
  spot: 50000000000000000000n,
  max: 54772255750516611345n,
} as const

describe('ConcentrateLiquidityCalculator', () => {
  describe('new / token0 / token1', () => {
    it('should set token0 to lower address and token1 to higher', () => {
      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: tokenInfo(USDC_ADDRESS, 6, 0n),
        tokenB: tokenInfo(WETH_ADDRESS, 18, 0n),
      })
      expect(calc.token0.address.toString()).toBe(USDC_ADDRESS.toLowerCase())
      expect(calc.token1.address.toString()).toBe(WETH_ADDRESS.toLowerCase())
      expect(BigInt(calc.token0.address.toString()) < BigInt(calc.token1.address.toString())).toBe(
        true,
      )
    })

    it('should derive token0/token1 regardless of tokenA/tokenB order', () => {
      const calcReversed = ConcentrateLiquidityCalculator.new({
        tokenA: tokenInfo(WETH_ADDRESS, 18, 0n),
        tokenB: tokenInfo(USDC_ADDRESS, 6, 0n),
      })
      expect(calcReversed.token0.address.toString()).toBe(USDC_ADDRESS.toLowerCase())
      expect(calcReversed.token1.address.toString()).toBe(WETH_ADDRESS.toLowerCase())
    })
  })

  describe('computeMaxAllocation', () => {
    const maxUsdc = 1_000_000n * 10n ** 6n
    const maxWeth = 400n * 10n ** 18n
    const multUsdcWeth = 10n ** 24n

    it('should return reserves when quote is token0 (USDC)', () => {
      const usdc = tokenInfo(USDC_ADDRESS, 6, maxUsdc)
      const weth = tokenInfo(WETH_ADDRESS, 18, maxWeth)
      const ab = tokenAB(usdc, weth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.min, ab),
        spotPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.spot, ab),
        maxPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.max, ab),
      }

      const result = calc.computeMaxAllocation(prices)

      expect(result.token0Reserve).toBe(999999999999n)
      expect(result.token1Reserve).toBe(330119361793825978647n)
    })

    it('should return same allocation when quote is token1 (WETH)', () => {
      const usdc = tokenInfo(USDC_ADDRESS, 6, maxUsdc)
      const weth = tokenInfo(WETH_ADDRESS, 18, maxWeth)
      const pair = pricePair(weth, usdc)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      // 2000/2500/3000 USDC per 1 WETH <=> 1/3000, 1/2500, 1/2000 WETH per 1 USDC (min < spot < max)
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman(formatUnits(multUsdcWeth / 3000n, 24), pair),
        spotPrice: Price.fromHuman(formatUnits(multUsdcWeth / 2500n, 24), pair),
        maxPrice: Price.fromHuman(formatUnits(multUsdcWeth / 2000n, 24), pair),
      }

      const result = calc.computeMaxAllocation(prices)

      expect(result.token0Reserve).toBe(999999999999n)
      expect(result.token1Reserve).toBe(330119361793825978648n)
    })
  })

  describe('computeFixedAllocation', () => {
    const maxUsdc = 2_000_000n * 10n ** 6n
    const maxWeth = 500n * 10n ** 18n

    it('should compute reserves when token0 (USDC) amount is fixed', () => {
      const usdc = tokenInfo(USDC_ADDRESS, 6, maxUsdc)
      const weth = tokenInfo(WETH_ADDRESS, 18, maxWeth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      const ab = tokenAB(usdc, weth)
      const prices: PriceAllocationRange = {
        minPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.min, ab),
        spotPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.spot, ab),
        maxPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.max, ab),
      }
      const fixedUsdc = 1_000_000n * 10n ** 6n

      const result = calc.computeFixedAllocation(prices, new Address(USDC_ADDRESS), fixedUsdc)

      expect(result.token0Reserve).toBe(999999999999n)
      expect(result.token1Reserve).toBe(330119361793825978647n)
    })

    it('should compute reserves when token1 (WETH) amount is fixed', () => {
      const usdc = tokenInfo(USDC_ADDRESS, 6, maxUsdc)
      const weth = tokenInfo(WETH_ADDRESS, 18, maxWeth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      const ab = tokenAB(usdc, weth)
      const prices: PriceAllocationRange = {
        minPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.min, ab),
        spotPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.spot, ab),
        maxPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.max, ab),
      }
      const fixedWeth = 100n * 10n ** 18n

      const result = calc.computeFixedAllocation(prices, new Address(WETH_ADDRESS), fixedWeth)

      expect(result.token0Reserve).toBe(302920735871n)
      expect(result.token1Reserve).toBe(99999999999999998827n)
    })
  })

  describe('WETH / MUSD (same decimals, 18)', () => {
    const decimals = 18
    const maxWeth = 400n * 10n ** 18n
    const maxMUSD = 1_000_000n * 10n ** 18n

    it('should set token0 (WETH) and token1 (MUSD) by address order', () => {
      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: tokenInfo(WETH_ADDRESS, decimals, maxWeth),
        tokenB: tokenInfo(MUSD_ADDRESS, decimals, maxMUSD),
      })
      expect(calc.token0.address.toString()).toBe(WETH_ADDRESS.toLowerCase())
      expect(calc.token1.address.toString()).toBe(MUSD_ADDRESS.toLowerCase())
    })

    it('should compute max allocation when quote is token1 (MUSD)', () => {
      const musd = tokenInfo(MUSD_ADDRESS, decimals, maxMUSD)
      const weth = tokenInfo(WETH_ADDRESS, decimals, maxWeth)
      const pair = pricePair(musd, weth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: musd,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('2000', pair),
        spotPrice: Price.fromHuman('2500', pair),
        maxPrice: Price.fromHuman('3000', pair),
      }

      const result = calc.computeMaxAllocation(prices)

      expect(result.token0Reserve).toBe(330119361793825980083n)
      expect(result.token1Reserve).toBe(999999999999999999999998n)
    })

    it('should compute max allocation when quote is token0 (WETH)', () => {
      const musd = tokenInfo(MUSD_ADDRESS, decimals, maxMUSD)
      const weth = tokenInfo(WETH_ADDRESS, decimals, maxWeth)
      const ab = tokenAB(musd, weth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: musd,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromSqrt(WETH_MUSD_SQRT_RANGE.min, ab),
        spotPrice: Price.fromSqrt(WETH_MUSD_SQRT_RANGE.spot, ab),
        maxPrice: Price.fromSqrt(WETH_MUSD_SQRT_RANGE.max, ab),
      }

      const result = calc.computeMaxAllocation(prices)

      expect(result.token0Reserve).toBe(330119361793825980083n)
      expect(result.token1Reserve).toBe(999999999999999999999998n)
    })

    it('should compute fixed allocation when token1 (MUSD) amount is fixed', () => {
      const musd = tokenInfo(MUSD_ADDRESS, decimals, maxMUSD)
      const weth = tokenInfo(WETH_ADDRESS, decimals, maxWeth)
      const pair = pricePair(musd, weth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: musd,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('2000', pair),
        spotPrice: Price.fromHuman('2500', pair),
        maxPrice: Price.fromHuman('3000', pair),
      }
      const fixedMUSD = 100_000n * 10n ** 18n

      const result = calc.computeFixedAllocation(prices, new Address(MUSD_ADDRESS), fixedMUSD)

      expect(result.token0Reserve).toBe(33011936179382598008n)
      expect(result.token1Reserve).toBe(99999999999999999999998n)
    })

    it('should compute fixed allocation when token0 (WETH) amount is fixed', () => {
      const musd = tokenInfo(MUSD_ADDRESS, decimals, maxMUSD)
      const weth = tokenInfo(WETH_ADDRESS, decimals, maxWeth)
      const pair = pricePair(musd, weth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: musd,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman('2000', pair),
        spotPrice: Price.fromHuman('2500', pair),
        maxPrice: Price.fromHuman('3000', pair),
      }
      const fixedWeth = 10n * 10n ** 18n

      const result = calc.computeFixedAllocation(prices, new Address(WETH_ADDRESS), fixedWeth)

      expect(result.token0Reserve).toBe(9999999999999999999n)
      expect(result.token1Reserve).toBe(30292073587145241674914n)
    })
  })

  describe('computeSpotPrice', () => {
    const maxUsdc = 1_000_000n * 10n ** 6n
    const maxWeth = 400n * 10n ** 18n
    const multUsdcWeth = 10n ** 24n

    it('should match concentrate-liquidity-math given scaled bounds (quote token0)', () => {
      const usdc = tokenInfo(USDC_ADDRESS, 6, maxUsdc)
      const weth = tokenInfo(WETH_ADDRESS, 18, maxWeth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      const ab = tokenAB(usdc, weth)
      const prices: PriceAllocationRange = {
        minPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.min, ab),
        spotPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.spot, ab),
        maxPrice: Price.fromSqrt(USDC_WETH_SQRT_RANGE.max, ab),
      }

      const allocation = calc.computeMaxAllocation(prices)
      const bounds: PriceBounds = {
        minPrice: prices.minPrice,
        maxPrice: prices.maxPrice,
      }

      const spot = calc.computeSpotPrice(allocation, bounds)

      expect(spot).toBe(20000000000001729646634n)
    })

    it('should match concentrate-liquidity-math given scaled bounds (quote token1)', () => {
      const usdc = tokenInfo(USDC_ADDRESS, 6, maxUsdc)
      const weth = tokenInfo(WETH_ADDRESS, 18, maxWeth)
      const pair = pricePair(weth, usdc)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman(formatUnits(multUsdcWeth / 3000n, 24), pair),
        spotPrice: Price.fromHuman(formatUnits(multUsdcWeth / 2500n, 24), pair),
        maxPrice: Price.fromHuman(formatUnits(multUsdcWeth / 2000n, 24), pair),
      }

      const allocation = calc.computeMaxAllocation(prices)
      const bounds: PriceBounds = {
        minPrice: prices.minPrice,
        maxPrice: prices.maxPrice,
      }

      const spot = calc.computeSpotPrice(allocation, bounds)

      expect(spot).toBe(20000000000001729646631n)
    })
  })
})
