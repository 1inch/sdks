// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { ConcentrateLiquidityCalculator } from './concentrate-liquidity-calculator'
import type { ConcentrateTokenInfo, ScaledPrices } from './types'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

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

    it('should return sqrt prices and reserves when quote is token0 (USDC)', () => {
      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: tokenInfo(USDC_ADDRESS, 6, maxUsdc),
        tokenB: tokenInfo(WETH_ADDRESS, 18, maxWeth),
      })
      const prices: ScaledPrices = {
        quoteToken: new Address(USDC_ADDRESS),
        minPriceRaw: 2000n * 10n ** (6n + 18n),
        spotPriceRaw: 2500n * 10n ** (6n + 18n),
        maxPriceRaw: 3000n * 10n ** (6n + 18n),
      }

      const result = calc.computeMaxAllocation(prices)

      expect(result.sqrtPriceMin).toBe(18257418583505537115232n)
      expect(result.sqrtPriceSpot).toBe(20000000000000000000000n)
      expect(result.sqrtPriceMax).toBe(22360679774997896964091n)
      expect(result.token0Reserve).toBe(999999999999n)
      expect(result.token1Reserve).toBe(330119361793776327274n)
    })

    it('should return same allocation when quote is token1 (WETH)', () => {
      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: tokenInfo(USDC_ADDRESS, 6, maxUsdc),
        tokenB: tokenInfo(WETH_ADDRESS, 18, maxWeth),
      })
      // 2000/2500/3000 USDC per 1 WETH <=> 1/3000, 1/2500, 1/2000 WETH per 1 USDC (min < spot < max)
      const pricesToken1: ScaledPrices = {
        quoteToken: new Address(WETH_ADDRESS),
        minPriceRaw: 10n ** (18n + 6n) / 3000n,
        spotPriceRaw: 10n ** (18n + 6n) / 2500n,
        maxPriceRaw: 10n ** (18n + 6n) / 2000n,
      }

      const result = calc.computeMaxAllocation(pricesToken1)

      expect(result.sqrtPriceMin).toBe(18257418583505537115223n)
      expect(result.sqrtPriceSpot).toBe(20000000000000000000000n)
      expect(result.sqrtPriceMax).toBe(22360679774997896964091n)
      expect(result.token0Reserve).toBe(999999999999n)
      expect(result.token1Reserve).toBe(330119361793776327276n)
    })
  })

  describe('computeFixedAllocation', () => {
    const maxUsdc = 2_000_000n * 10n ** 6n
    const maxWeth = 500n * 10n ** 18n

    it('should compute reserves when token0 (USDC) amount is fixed', () => {
      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: tokenInfo(USDC_ADDRESS, 6, maxUsdc),
        tokenB: tokenInfo(WETH_ADDRESS, 18, maxWeth),
      })
      const prices: ScaledPrices = {
        quoteToken: new Address(USDC_ADDRESS),
        minPriceRaw: 2000n * 10n ** (6n + 18n),
        spotPriceRaw: 2500n * 10n ** (6n + 18n),
        maxPriceRaw: 3000n * 10n ** (6n + 18n),
      }
      const fixedUsdc = 1_000_000n * 10n ** 6n

      const result = calc.computeFixedAllocation(prices, new Address(USDC_ADDRESS), fixedUsdc)

      expect(result.sqrtPriceMin).toBe(18257418583505537115232n)
      expect(result.sqrtPriceSpot).toBe(20000000000000000000000n)
      expect(result.sqrtPriceMax).toBe(22360679774997896964091n)
      expect(result.token0Reserve).toBe(999999999999n)
      expect(result.token1Reserve).toBe(330119361793776327274n)
    })

    it('should compute reserves when token1 (WETH) amount is fixed', () => {
      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: tokenInfo(USDC_ADDRESS, 6, maxUsdc),
        tokenB: tokenInfo(WETH_ADDRESS, 18, maxWeth),
      })
      const prices: ScaledPrices = {
        quoteToken: new Address(USDC_ADDRESS),
        minPriceRaw: 2000n * 10n ** (6n + 18n),
        spotPriceRaw: 2500n * 10n ** (6n + 18n),
        maxPriceRaw: 3000n * 10n ** (6n + 18n),
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

  describe('computeRawPrices (via unknown quote)', () => {
    it('should throw when quoteToken is neither token', () => {
      const otherAddress = '0x0000000000000000000000000000000000000001'
      const calc = ConcentrateLiquidityCalculator.new({
        tokenA: tokenInfo(USDC_ADDRESS, 6, 0n),
        tokenB: tokenInfo(WETH_ADDRESS, 18, 0n),
      })
      const prices: ScaledPrices = {
        quoteToken: new Address(otherAddress),
        minPriceRaw: 2000n * 10n ** (6n + 18n),
        spotPriceRaw: 2500n * 10n ** (6n + 18n),
        maxPriceRaw: 3000n * 10n ** (6n + 18n),
      }

      expect(() => calc.computeMaxAllocation(prices)).toThrow('unknown quote token')
    })
  })
})
