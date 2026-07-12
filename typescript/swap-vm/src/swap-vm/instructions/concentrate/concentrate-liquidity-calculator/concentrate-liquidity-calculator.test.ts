// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { ConcentrateLiquidityCalculator } from './concentrate-liquidity-calculator'
import { Price } from '../price'
import type { PricePair, PriceToken } from '../price/types'

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
/** Extra token for negative tests (not USDC/WETH). */
const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')

const USDC_TOKEN: PriceToken = { address: USDC, decimals: 6n }
const WETH_TOKEN: PriceToken = { address: WETH, decimals: 18n }
const DAI_TOKEN: PriceToken = { address: DAI, decimals: 18n }

const pairUsdcQuoteWethBase: PricePair = { quoteToken: USDC_TOKEN, baseToken: WETH_TOKEN }

/** USDC has the lower address, so it is token0 and WETH is token1. */
const calculator = ConcentrateLiquidityCalculator.new({
  tokenA: { address: USDC, decimals: 6n, maxAvailableLiquidity: 1_000_000n * 10n ** 6n },
  tokenB: { address: WETH, decimals: 18n, maxAvailableLiquidity: 400n * 10n ** 18n },
})

describe('ConcentrateLiquidityCalculator', () => {
  describe('computeSingleSidedRange', () => {
    /**
     * For a USDC-quoted pair a *lower* human price means a *higher* sqrt(token1/token0),
     * so '2000 USDC per WETH' is above '3000 USDC per WETH' in sqrt terms.
     */
    const sqrtLowBound = Price.fromHuman('3000', pairUsdcQuoteWethBase)
    const spot = Price.fromHuman('2500', pairUsdcQuoteWethBase)
    const sqrtHighBound = Price.fromHuman('2000', pairUsdcQuoteWethBase)

    it('should place spot at the min bound for a token0 (USDC) deposit', () => {
      const reserve = 1_000_000n * 10n ** 6n

      const result = calculator.computeSingleSidedRange(spot, sqrtHighBound, USDC, reserve)

      expect(result.prices.minPrice).toBe(spot)
      expect(result.prices.spotPrice).toBe(spot)
      expect(result.prices.maxPrice).toBe(sqrtHighBound)
      expect(result.reserves.token0Reserve).toBe(reserve)
      expect(result.reserves.token1Reserve).toBe(0n)
    })

    it('should place spot at the max bound for a token1 (WETH) deposit', () => {
      const reserve = 100n * 10n ** 18n

      const result = calculator.computeSingleSidedRange(spot, sqrtLowBound, WETH, reserve)

      expect(result.prices.minPrice).toBe(sqrtLowBound)
      expect(result.prices.spotPrice).toBe(spot)
      expect(result.prices.maxPrice).toBe(spot)
      expect(result.reserves.token0Reserve).toBe(0n)
      expect(result.reserves.token1Reserve).toBe(reserve)
    })

    it('should produce a range consistent with computeFixedAllocation (token0 deposit)', () => {
      const reserve = 1_000_000n * 10n ** 6n

      const result = calculator.computeSingleSidedRange(spot, sqrtHighBound, USDC, reserve)
      const allocation = calculator.computeFixedAllocation(result.prices, USDC, reserve)

      /** Only token0 is required; the fixed side may lose a few wei to integer math. */
      expect(allocation.token1Reserve).toBe(0n)
      expect(allocation.token0Reserve).toBeLessThanOrEqual(reserve)
      expect(allocation.token0Reserve).toBeGreaterThan((reserve * 999_999n) / 1_000_000n)
    })

    it('should produce a range consistent with computeFixedAllocation (token1 deposit)', () => {
      const reserve = 100n * 10n ** 18n

      const result = calculator.computeSingleSidedRange(spot, sqrtLowBound, WETH, reserve)
      const allocation = calculator.computeFixedAllocation(result.prices, WETH, reserve)

      expect(allocation.token0Reserve).toBe(0n)
      expect(allocation.token1Reserve).toBeLessThanOrEqual(reserve)
      expect(allocation.token1Reserve).toBeGreaterThan((reserve * 999_999n) / 1_000_000n)
    })

    it('should throw when the reserve is zero', () => {
      expect(() => calculator.computeSingleSidedRange(spot, sqrtHighBound, USDC, 0n)).toThrow(
        'reserve must be positive',
      )
    })

    it('should throw when the bound is below spot for a token0 deposit', () => {
      expect(() => calculator.computeSingleSidedRange(spot, sqrtLowBound, USDC, 1n)).toThrow(
        'price bound should be above spot for a token0 deposit',
      )
    })

    it('should throw when the bound is above spot for a token1 deposit', () => {
      expect(() => calculator.computeSingleSidedRange(spot, sqrtHighBound, WETH, 1n)).toThrow(
        'price bound should be below spot for a token1 deposit',
      )
    })

    it('should throw when the bound equals spot (degenerate range)', () => {
      expect(() => calculator.computeSingleSidedRange(spot, spot, USDC, 1n)).toThrow(
        'price bound should be above spot for a token0 deposit',
      )
    })

    it('should throw when the reserve token is not in the pair', () => {
      expect(() => calculator.computeSingleSidedRange(spot, sqrtHighBound, DAI, 1n)).toThrow(
        'reserve should be in some pair token',
      )
    })

    it('should throw when prices are for a different pair', () => {
      const pairUsdcQuoteDaiBase: PricePair = { quoteToken: USDC_TOKEN, baseToken: DAI_TOKEN }
      const foreignSpot = Price.fromHuman('1', pairUsdcQuoteDaiBase)
      const foreignBound = Price.fromHuman('0.9', pairUsdcQuoteDaiBase)

      expect(() => calculator.computeSingleSidedRange(foreignSpot, foreignBound, USDC, 1n)).toThrow(
        'prices should be for the calculator token pair',
      )
    })
  })
})
