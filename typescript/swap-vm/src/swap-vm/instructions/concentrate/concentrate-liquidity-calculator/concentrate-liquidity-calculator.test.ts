// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import { ConcentrateLiquidityCalculator } from './concentrate-liquidity-calculator'
import { Price } from '../price'
import type { PricePair, PriceToken } from '../price/types'
import {
  computeBalances,
  computeLiquidityFromAmounts,
} from '../concentrate-liquidity-math/concentrate-liquidity-math'

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
/** Extra token for negative tests (not USDC/WETH). */
const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')

const USDC_TOKEN: PriceToken = { address: USDC, decimals: 6n }
const WETH_TOKEN: PriceToken = { address: WETH, decimals: 18n }
const DAI_TOKEN: PriceToken = { address: DAI, decimals: 18n }

const pairUsdcQuoteWethBase: PricePair = { quoteToken: USDC_TOKEN, baseToken: WETH_TOKEN }

const maxUsdc = 1_000_000n * 10n ** 6n
const maxWeth = 800n * 10n ** 18n

/** USDC has the lower address, so it is token0 and WETH is token1. */
const calculator = ConcentrateLiquidityCalculator.new({
  tokenA: { address: USDC, decimals: 6n, maxAvailableLiquidity: maxUsdc },
  tokenB: { address: WETH, decimals: 18n, maxAvailableLiquidity: maxWeth },
})

describe('ConcentrateLiquidityCalculator', () => {
  describe('computeSingleSidedRange', () => {
    const spot = Price.fromHuman('2500', pairUsdcQuoteWethBase)

    describe('token0 (USDC) deposit', () => {
      /** 1,000,000 USDC at 2500 is worth 400 WETH; target is maxWeth = 800 WETH. */
      const reserve = 1_000_000n * 10n ** 6n

      it('should place spot at the min bound and derive the max bound', () => {
        const range = calculator.computeSingleSidedRange(spot, USDC, reserve)

        expect(range.minPrice).toBe(spot)
        expect(range.spotPrice).toBe(spot)
        /**
         * Range-order relation: sqrtPmax = targetGt * 1e18^2 / (reserve * sqrtPspot).
         * Converting 1,000,000 USDC into 800 WETH means an average execution of
         * 1250 USDC/WETH = sqrt(2500 * 625), so the far bound is 625 USDC per WETH.
         */
        expect(range.maxPrice.toSqrt()).toBe(2n * spot.toSqrt())
        expect(range.maxPrice.toHuman(USDC)).toBe('625')
      })

      it('should fully convert the reserve into token1 maxAvailableLiquidity at the far bound', () => {
        const range = calculator.computeSingleSidedRange(spot, USDC, reserve)

        const { targetL } = computeLiquidityFromAmounts(
          reserve,
          UINT_256_MAX,
          range.spotPrice.toSqrt(),
          range.minPrice.toSqrt(),
          range.maxPrice.toSqrt(),
        )
        /** Same liquidity, spot moved to the far bound: all token0 sold for token1. */
        const atFarBound = computeBalances(
          targetL,
          range.maxPrice.toSqrt(),
          range.minPrice.toSqrt(),
          range.maxPrice.toSqrt(),
        )

        expect(atFarBound.bLt).toBe(0n)
        expect(atFarBound.bGt).toBe(maxWeth)
      })

      it('should produce a range accepted by computeFixedAllocation', () => {
        const range = calculator.computeSingleSidedRange(spot, USDC, reserve)

        const allocation = calculator.computeFixedAllocation(range, USDC, reserve)

        /** Only token0 is required; the fixed side may lose a few wei to integer math. */
        expect(allocation.token1Reserve).toBe(0n)
        expect(allocation.token0Reserve).toBeLessThanOrEqual(reserve)
        expect(allocation.token0Reserve).toBeGreaterThan((reserve * 999_999n) / 1_000_000n)
      })
    })

    describe('token1 (WETH) deposit', () => {
      /** 200 WETH at 2500 is worth 500,000 USDC; target is maxUsdc = 1,000,000 USDC. */
      const reserve = 200n * 10n ** 18n

      it('should place spot at the max bound and derive the min bound', () => {
        const range = calculator.computeSingleSidedRange(spot, WETH, reserve)

        expect(range.maxPrice).toBe(spot)
        expect(range.spotPrice).toBe(spot)
        /**
         * Range-order relation: sqrtPmin = reserve * 1e18^2 / (targetLt * sqrtPspot).
         * Converting 200 WETH into 1,000,000 USDC means an average execution of
         * 5000 USDC/WETH = sqrt(2500 * 10000), so the far bound is 10000 USDC per WETH.
         */
        expect(range.minPrice.toSqrt()).toBe(spot.toSqrt() / 2n)
        expect(range.minPrice.toHuman(USDC)).toBe('10000')
      })

      it('should fully convert the reserve into token0 maxAvailableLiquidity at the far bound', () => {
        const range = calculator.computeSingleSidedRange(spot, WETH, reserve)

        const { targetL } = computeLiquidityFromAmounts(
          UINT_256_MAX,
          reserve,
          range.spotPrice.toSqrt(),
          range.minPrice.toSqrt(),
          range.maxPrice.toSqrt(),
        )
        /** Same liquidity, spot moved to the far bound: all token1 sold for token0. */
        const atFarBound = computeBalances(
          targetL,
          range.minPrice.toSqrt(),
          range.minPrice.toSqrt(),
          range.maxPrice.toSqrt(),
        )

        expect(atFarBound.bLt).toBe(maxUsdc)
        expect(atFarBound.bGt).toBe(0n)
      })

      it('should produce a range accepted by computeFixedAllocation', () => {
        const range = calculator.computeSingleSidedRange(spot, WETH, reserve)

        const allocation = calculator.computeFixedAllocation(range, WETH, reserve)

        expect(allocation.token0Reserve).toBe(0n)
        expect(allocation.token1Reserve).toBeLessThanOrEqual(reserve)
        expect(allocation.token1Reserve).toBeGreaterThan((reserve * 999_999n) / 1_000_000n)
      })
    })

    describe('validation', () => {
      it('should throw when the reserve is zero', () => {
        expect(() => calculator.computeSingleSidedRange(spot, USDC, 0n)).toThrow(
          'reserve must be positive',
        )
      })

      it('should throw when the reserve token is not in the pair', () => {
        expect(() => calculator.computeSingleSidedRange(spot, DAI, 1n)).toThrow(
          'reserve should be in some pair token',
        )
      })

      it('should throw when the spot price is for a different pair', () => {
        const pairUsdcQuoteDaiBase: PricePair = { quoteToken: USDC_TOKEN, baseToken: DAI_TOKEN }
        const foreignSpot = Price.fromHuman('1', pairUsdcQuoteDaiBase)

        expect(() => calculator.computeSingleSidedRange(foreignSpot, USDC, 1n)).toThrow(
          'prices should be for the calculator token pair',
        )
      })

      it('should throw when token1 maxAvailableLiquidity does not exceed the deposit spot value', () => {
        /** 1,000,000 USDC at 2500 is worth exactly 400 WETH — no room for a range. */
        const smallTarget = ConcentrateLiquidityCalculator.new({
          tokenA: { address: USDC, decimals: 6n, maxAvailableLiquidity: maxUsdc },
          tokenB: { address: WETH, decimals: 18n, maxAvailableLiquidity: 400n * 10n ** 18n },
        })

        expect(() =>
          smallTarget.computeSingleSidedRange(spot, USDC, 1_000_000n * 10n ** 6n),
        ).toThrow('token1 maxAvailableLiquidity should exceed the spot value of the deposit')
      })

      it('should throw when token0 maxAvailableLiquidity does not exceed the deposit spot value', () => {
        /** 400 WETH at 2500 is worth exactly 1,000,000 USDC — no room for a range. */
        expect(() => calculator.computeSingleSidedRange(spot, WETH, 400n * 10n ** 18n)).toThrow(
          'token0 maxAvailableLiquidity should exceed the spot value of the deposit',
        )
      })
    })
  })
})
