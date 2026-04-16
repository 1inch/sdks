// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { formatUnits } from 'viem'
import { ConcentrateLiquidityCalculator } from './concentrate-liquidity-calculator'
import type { ConcentrateTokenInfo, PriceAllocationRange, PriceBounds } from './types'
import { Price } from '../price'

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

    it('should return sqrt prices and reserves when quote is token0 (USDC)', () => {
      const usdc = tokenInfo(USDC_ADDRESS, 6, maxUsdc)
      const weth = tokenInfo(WETH_ADDRESS, 18, maxWeth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: '2000',
          quoteToken: usdc,
          baseToken: weth,
        }),
        spotPrice: Price.fromHuman({
          price: '2500',
          quoteToken: usdc,
          baseToken: weth,
        }),
        maxPrice: Price.fromHuman({
          price: '3000',
          quoteToken: usdc,
          baseToken: weth,
        }),
      }

      const result = calc.computeMaxAllocation(prices)

      expect(result.sqrtPriceMin).toBe(18257418583505537115232n)
      expect(result.sqrtPriceSpot).toBe(20000000000000000000000n)
      expect(result.sqrtPriceMax).toBe(22360679774997896964091n)
      expect(result.token0Reserve).toBe(999999999999n)
      expect(result.token1Reserve).toBe(330119361793825978647n)
    })

    it('should return same allocation when quote is token1 (WETH)', () => {
      const usdc = tokenInfo(USDC_ADDRESS, 6, maxUsdc)
      const weth = tokenInfo(WETH_ADDRESS, 18, maxWeth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      // 2000/2500/3000 USDC per 1 WETH <=> 1/3000, 1/2500, 1/2000 WETH per 1 USDC (min < spot < max)
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: formatUnits(multUsdcWeth / 3000n, 24),
          quoteToken: weth,
          baseToken: usdc,
        }),
        spotPrice: Price.fromHuman({
          price: formatUnits(multUsdcWeth / 2500n, 24),
          quoteToken: weth,
          baseToken: usdc,
        }),
        maxPrice: Price.fromHuman({
          price: formatUnits(multUsdcWeth / 2000n, 24),
          quoteToken: weth,
          baseToken: usdc,
        }),
      }

      const result = calc.computeMaxAllocation(prices)

      expect(result.sqrtPriceMin).toBe(18257418583505537115223n)
      expect(result.sqrtPriceSpot).toBe(20000000000000000000000n)
      expect(result.sqrtPriceMax).toBe(22360679774997896964091n)
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
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: '2000',
          quoteToken: usdc,
          baseToken: weth,
        }),
        spotPrice: Price.fromHuman({
          price: '2500',
          quoteToken: usdc,
          baseToken: weth,
        }),
        maxPrice: Price.fromHuman({
          price: '3000',
          quoteToken: usdc,
          baseToken: weth,
        }),
      }
      const fixedUsdc = 1_000_000n * 10n ** 6n

      const result = calc.computeFixedAllocation(prices, new Address(USDC_ADDRESS), fixedUsdc)

      expect(result.sqrtPriceMin).toBe(18257418583505537115232n)
      expect(result.sqrtPriceSpot).toBe(20000000000000000000000n)
      expect(result.sqrtPriceMax).toBe(22360679774997896964091n)
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
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: '2000',
          quoteToken: usdc,
          baseToken: weth,
        }),
        spotPrice: Price.fromHuman({
          price: '2500',
          quoteToken: usdc,
          baseToken: weth,
        }),
        maxPrice: Price.fromHuman({
          price: '3000',
          quoteToken: usdc,
          baseToken: weth,
        }),
      }
      const fixedWeth = 100n * 10n ** 18n

      const result = calc.computeFixedAllocation(prices, new Address(WETH_ADDRESS), fixedWeth)

      expect(result.sqrtPriceMin).toBe(18257418583505537115232n)
      expect(result.sqrtPriceSpot).toBe(20000000000000000000000n)
      expect(result.sqrtPriceMax).toBe(22360679774997896964091n)
      expect(result.token0Reserve).toBe(302920735871n)
      expect(result.token1Reserve).toBe(99999999999999998827n)
    })
  })

  describe('WETH / MUSD (same decimals, 18)', () => {
    const decimals = 18
    const multiplier = 10n ** BigInt(decimals + decimals) // 10^36
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

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: musd,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: '2000',
          quoteToken: musd,
          baseToken: weth,
        }),
        spotPrice: Price.fromHuman({
          price: '2500',
          quoteToken: musd,
          baseToken: weth,
        }),
        maxPrice: Price.fromHuman({
          price: '3000',
          quoteToken: musd,
          baseToken: weth,
        }),
      }

      const result = calc.computeMaxAllocation(prices)

      expect(result.sqrtPriceMin).toBe(44721359549995793928n)
      expect(result.sqrtPriceSpot).toBe(50000000000000000000n)
      expect(result.sqrtPriceMax).toBe(54772255750516611345n)
      expect(result.token0Reserve).toBe(330119361793825980083n)
      expect(result.token1Reserve).toBe(999999999999999999999998n)
    })

    it('should compute max allocation when quote is token0 (WETH)', () => {
      const musd = tokenInfo(MUSD_ADDRESS, decimals, maxMUSD)
      const weth = tokenInfo(WETH_ADDRESS, decimals, maxWeth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: musd,
        tokenB: weth,
      })
      // 1/3000, 1/2500, 1/2000 WETH per 1 MUSD (same range as above)
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: formatUnits(multiplier / 3000n, 36),
          quoteToken: weth,
          baseToken: musd,
        }),
        spotPrice: Price.fromHuman({
          price: formatUnits(multiplier / 2500n, 36),
          quoteToken: weth,
          baseToken: musd,
        }),
        maxPrice: Price.fromHuman({
          price: formatUnits(multiplier / 2000n, 36),
          quoteToken: weth,
          baseToken: musd,
        }),
      }

      const result = calc.computeMaxAllocation(prices)

      expect(result.sqrtPriceMin).toBe(44721359549995793928n)
      expect(result.sqrtPriceSpot).toBe(50000000000000000000n)
      expect(result.sqrtPriceMax).toBe(54772255750516611345n)
      expect(result.token0Reserve).toBe(330119361793825980083n)
      expect(result.token1Reserve).toBe(999999999999999999999998n)
    })

    it('should compute fixed allocation when token1 (MUSD) amount is fixed', () => {
      const musd = tokenInfo(MUSD_ADDRESS, decimals, maxMUSD)
      const weth = tokenInfo(WETH_ADDRESS, decimals, maxWeth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: musd,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: '2000',
          quoteToken: musd,
          baseToken: weth,
        }),
        spotPrice: Price.fromHuman({
          price: '2500',
          quoteToken: musd,
          baseToken: weth,
        }),
        maxPrice: Price.fromHuman({
          price: '3000',
          quoteToken: musd,
          baseToken: weth,
        }),
      }
      const fixedMUSD = 100_000n * 10n ** 18n

      const result = calc.computeFixedAllocation(prices, new Address(MUSD_ADDRESS), fixedMUSD)

      expect(result.sqrtPriceMin).toBe(44721359549995793928n)
      expect(result.sqrtPriceSpot).toBe(50000000000000000000n)
      expect(result.sqrtPriceMax).toBe(54772255750516611345n)
      expect(result.token0Reserve).toBe(33011936179382598008n)
      expect(result.token1Reserve).toBe(99999999999999999999998n)
    })

    it('should compute fixed allocation when token0 (WETH) amount is fixed', () => {
      const musd = tokenInfo(MUSD_ADDRESS, decimals, maxMUSD)
      const weth = tokenInfo(WETH_ADDRESS, decimals, maxWeth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: musd,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: '2000',
          quoteToken: musd,
          baseToken: weth,
        }),
        spotPrice: Price.fromHuman({
          price: '2500',
          quoteToken: musd,
          baseToken: weth,
        }),
        maxPrice: Price.fromHuman({
          price: '3000',
          quoteToken: musd,
          baseToken: weth,
        }),
      }
      const fixedWeth = 10n * 10n ** 18n

      const result = calc.computeFixedAllocation(prices, new Address(WETH_ADDRESS), fixedWeth)

      expect(result.sqrtPriceMin).toBe(44721359549995793928n)
      expect(result.sqrtPriceSpot).toBe(50000000000000000000n)
      expect(result.sqrtPriceMax).toBe(54772255750516611345n)
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
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: '2000',
          quoteToken: usdc,
          baseToken: weth,
        }),
        spotPrice: Price.fromHuman({
          price: '2500',
          quoteToken: usdc,
          baseToken: weth,
        }),
        maxPrice: Price.fromHuman({
          price: '3000',
          quoteToken: usdc,
          baseToken: weth,
        }),
      }

      const allocation = calc.computeMaxAllocation(prices)
      const bounds: PriceBounds = {
        minPrice: prices.minPrice,
        maxPrice: prices.maxPrice,
      }

      const spot = calc.computeSpotPrice(allocation.token0Reserve, allocation.token1Reserve, bounds)

      expect(spot).toBe(20000000000001729646634n)
    })

    it('should match concentrate-liquidity-math given scaled bounds (quote token1)', () => {
      const usdc = tokenInfo(USDC_ADDRESS, 6, maxUsdc)
      const weth = tokenInfo(WETH_ADDRESS, 18, maxWeth)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: formatUnits(multUsdcWeth / 3000n, 24),
          quoteToken: weth,
          baseToken: usdc,
        }),
        spotPrice: Price.fromHuman({
          price: formatUnits(multUsdcWeth / 2500n, 24),
          quoteToken: weth,
          baseToken: usdc,
        }),
        maxPrice: Price.fromHuman({
          price: formatUnits(multUsdcWeth / 2000n, 24),
          quoteToken: weth,
          baseToken: usdc,
        }),
      }

      const allocation = calc.computeMaxAllocation(prices)
      const bounds: PriceBounds = {
        minPrice: prices.minPrice,
        maxPrice: prices.maxPrice,
      }

      const spot = calc.computeSpotPrice(allocation.token0Reserve, allocation.token1Reserve, bounds)

      expect(spot).toBe(20000000000001729646631n)
    })

    it('should throw when quoteToken is neither token', () => {
      const otherAddress = '0x0000000000000000000000000000000000000001'
      const usdc = tokenInfo(USDC_ADDRESS, 6, 0n)
      const weth = tokenInfo(WETH_ADDRESS, 18, 0n)
      const other = tokenInfo(otherAddress, 18, 0n)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      const bounds: PriceBounds = {
        minPrice: Price.fromHuman({
          price: '2000',
          quoteToken: other,
          baseToken: usdc,
        }),
        maxPrice: Price.fromHuman({
          price: '3000',
          quoteToken: other,
          baseToken: usdc,
        }),
      }

      expect(() => calc.computeSpotPrice(1n, 1n, bounds)).toThrow('unknown quote token')
    })
  })

  describe('computeRawPrices (via unknown quote)', () => {
    it('should throw when quoteToken is neither token', () => {
      const otherAddress = '0x0000000000000000000000000000000000000001'
      const usdc = tokenInfo(USDC_ADDRESS, 6, 0n)
      const weth = tokenInfo(WETH_ADDRESS, 18, 0n)
      const other = tokenInfo(otherAddress, 18, 0n)

      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: usdc,
        tokenB: weth,
      })
      const prices: PriceAllocationRange = {
        minPrice: Price.fromHuman({
          price: '2000',
          quoteToken: other,
          baseToken: usdc,
        }),
        spotPrice: Price.fromHuman({
          price: '2500',
          quoteToken: other,
          baseToken: usdc,
        }),
        maxPrice: Price.fromHuman({
          price: '3000',
          quoteToken: other,
          baseToken: usdc,
        }),
      }

      expect(() => calc.computeMaxAllocation(prices)).toThrow('unknown quote token')
    })
  })
})
