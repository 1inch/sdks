// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { expect } from 'vitest'
import { parseUnits } from 'viem'
import { UINT_256_MAX } from '@1inch/byte-utils'
import { ONE_E18 } from './concentrate-grow-liquidity-2d-args'
import {
  computeBalances,
  computeLiquidityAndPrice,
  computeLiquidityFromAmounts,
} from './concentrate-liquidity-math'
import { bigintSqrt } from './bigint-sqrt'

describe('concentrate-liquidity-math', () => {
  describe('computeLiquidityAndPrice', () => {
    it('should compute liquidity and implied sqrtPriceSpot from real balances and bounds', () => {
      const balanceLt = 1000n * ONE_E18
      const balanceGt = 500n * ONE_E18
      const sqrtPriceMin = 9n * 10n ** 17n
      const sqrtPriceMax = 11n * 10n ** 17n

      const { liquidity, sqrtPriceSpot } = computeLiquidityAndPrice(
        balanceLt,
        balanceGt,
        sqrtPriceMin,
        sqrtPriceMax,
      )

      expect(liquidity).toBe(7802453249272148273618n)
      expect(sqrtPriceSpot).toBe(964082408958572419n)
    })

    it('should return spot within [sqrtPriceMin, sqrtPriceMax] for positive balances', () => {
      const balanceLt = 100n * ONE_E18
      const balanceGt = 100n * ONE_E18
      const sqrtPriceMin = 95n * 10n ** 16n
      const sqrtPriceMax = 105n * 10n ** 16n

      const { liquidity, sqrtPriceSpot } = computeLiquidityAndPrice(
        balanceLt,
        balanceGt,
        sqrtPriceMin,
        sqrtPriceMax,
      )

      expect(liquidity).toBe(2048750744047355406501n)
      expect(sqrtPriceSpot).toBe(998810232426052786n)
    })
  })

  describe('computeBalances', () => {
    it('should compute bLt and bGt from targetL and price bounds', () => {
      const targetL = 1000n * ONE_E18
      const sqrtPspot = ONE_E18
      const sqrtPmin = 9n * 10n ** 17n
      const sqrtPmax = 11n * 10n ** 17n

      const { bLt, bGt } = computeBalances(targetL, sqrtPspot, sqrtPmin, sqrtPmax)

      // bLt = L * (1/sqrtPspot - 1/sqrtPmax) = L * (1 - 1/1.1) ≈ L * 0.0909...
      // bGt = L * (sqrtPspot - sqrtPmin) = L * (1 - 0.9) = L * 0.1
      expect(bLt).toBe(90909090909090910000n)
      expect(bGt).toBe(100n * ONE_E18)
    })

    it('should satisfy round-trip: computeLiquidityFromAmounts(bLt, bGt) recovers targetL', () => {
      const targetL = 5000n * ONE_E18
      const sqrtPspot = 10n ** 18n
      const sqrtPmin = 8n * 10n ** 17n
      const sqrtPmax = 12n * 10n ** 17n

      const { bLt, bGt } = computeBalances(targetL, sqrtPspot, sqrtPmin, sqrtPmax)

      const result = computeLiquidityFromAmounts(bLt, bGt, sqrtPspot, sqrtPmin, sqrtPmax)

      expect(result.targetL).toBe(targetL)
      expect(result.actualLt).toBe(bLt)
      expect(result.actualGt).toBe(bGt)
    })
  })

  describe('computeLiquidityFromAmounts', () => {
    it('should return targetL as min of L implied by each token', () => {
      const sqrtPspot = ONE_E18
      const sqrtPmin = 9n * 10n ** 17n
      const sqrtPmax = 11n * 10n ** 17n

      // Make availableLt the limiting factor: small Lt, large Gt
      const availableLt = 100n * ONE_E18
      const availableGt = 1_000_000n * ONE_E18

      const { targetL, actualLt, actualGt } = computeLiquidityFromAmounts(
        availableLt,
        availableGt,
        sqrtPspot,
        sqrtPmin,
        sqrtPmax,
      )

      expect(actualLt).toBe(99999999999999999999n)
      expect(actualGt).toBe(109999999999999998900n)
      expect(targetL).toBe(1099999999999999989000n)
    })

    it('should return actual amounts that match computeBalances(targetL, ...)', () => {
      const availableLt = 200n * ONE_E18
      const availableGt = 300n * ONE_E18
      const sqrtPspot = ONE_E18
      const sqrtPmin = 95n * 10n ** 16n
      const sqrtPmax = 105n * 10n ** 16n

      const { targetL, actualLt, actualGt } = computeLiquidityFromAmounts(
        availableLt,
        availableGt,
        sqrtPspot,
        sqrtPmin,
        sqrtPmax,
      )

      const { bLt, bGt } = computeBalances(targetL, sqrtPspot, sqrtPmin, sqrtPmax)
      expect(actualLt).toBe(bLt)
      expect(actualGt).toBe(bGt)
    })

    it('when Lt is limiting, actualLt equals availableLt (rounding issue)', () => {
      const sqrtPspot = ONE_E18
      const sqrtPmin = 9n * 10n ** 17n
      const sqrtPmax = 11n * 10n ** 17n

      const availableLt = 50n * ONE_E18
      const availableGt = 10_000n * ONE_E18

      const { targetL, actualLt, actualGt } = computeLiquidityFromAmounts(
        availableLt,
        availableGt,
        sqrtPspot,
        sqrtPmin,
        sqrtPmax,
      )

      expect(targetL).toBe(549999999999999994500n)
      expect(actualLt).toBe(49999999999999999999n)
      expect(actualGt).toBe(54999999999999999450n)
    })

    it('when Gt is limiting, actualGt equals availableGt', () => {
      const sqrtPspot = ONE_E18
      const sqrtPmin = 9n * 10n ** 17n
      const sqrtPmax = 11n * 10n ** 17n

      const availableLt = 10_000n * ONE_E18
      const availableGt = 25n * ONE_E18

      const { targetL, actualLt, actualGt } = computeLiquidityFromAmounts(
        availableLt,
        availableGt,
        sqrtPspot,
        sqrtPmin,
        sqrtPmax,
      )

      expect(actualGt).toBe(availableGt)
      expect(actualLt).toBe(22727272727272727500n)
      expect(targetL).toBe(250000000000000000000n)
    })

    it('should handle spot at min bound (sqrtPspot === sqrtPmin)', () => {
      const sqrtPspot = 9n * 10n ** 17n
      const sqrtPmin = 9n * 10n ** 17n
      const sqrtPmax = 11n * 10n ** 17n

      const availableLt = 100n * ONE_E18
      const availableGt = 100n * ONE_E18

      const { targetL, actualLt, actualGt } = computeLiquidityFromAmounts(
        availableLt,
        availableGt,
        sqrtPspot,
        sqrtPmin,
        sqrtPmax,
      )

      expect(actualGt).toBe(0n)
      expect(targetL).toBe(494999999999999998044n)
      expect(actualLt).toBe(99999999999999999999n)
    })

    it('should handle spot at max bound (invSqrtPspot === invSqrtPmax)', () => {
      const sqrtPspot = 11n * 10n ** 17n
      const sqrtPmin = 9n * 10n ** 17n
      const sqrtPmax = 11n * 10n ** 17n

      const availableLt = 100n * ONE_E18
      const availableGt = 100n * ONE_E18

      const { targetL, actualLt, actualGt } = computeLiquidityFromAmounts(
        availableLt,
        availableGt,
        sqrtPspot,
        sqrtPmin,
        sqrtPmax,
      )

      expect(actualLt).toBe(0n)
      expect(targetL).toBe(500000000000000000000n)
      expect(actualGt).toBe(100000000000000000000n)
    })

    it('example: symmetric range around spot', () => {
      const sqrtPmin = 9n * 10n ** 17n
      const sqrtPmax = 11n * 10n ** 17n
      const sqrtPspot = ONE_E18

      const { bLt, bGt } = computeBalances(ONE_E18, sqrtPspot, sqrtPmin, sqrtPmax)

      const result = computeLiquidityFromAmounts(bLt, bGt, sqrtPspot, sqrtPmin, sqrtPmax)
      expect(result.targetL).toBe(ONE_E18)
      expect(result.actualLt).toBe(bLt)
      expect(result.actualGt).toBe(bGt)
    })

    it('should compute available liquidity for the given price range', () => {
      // USDC < WETH
      const USDC_DECIMALS = 6n
      const WETH_DECIMALS = 18n

      const prices = {
        leftBound: 2000n, // 2000 USDC per 1 WETH
        spotPrice: 2500n, // 2500 USDC per 1 WETH
        rightBound: 3000n, // 3000 USDC per 1 WETH
      }

      const rawPriceMin =
        (10n ** WETH_DECIMALS * ONE_E18) / (prices.rightBound * 10n ** USDC_DECIMALS)
      const rawSpotPrice =
        (10n ** WETH_DECIMALS * ONE_E18) / (prices.spotPrice * 10n ** USDC_DECIMALS)
      const rawPriceMax =
        (10n ** WETH_DECIMALS * ONE_E18) / (prices.leftBound * 10n ** USDC_DECIMALS)

      const sqrtPriceMin = bigintSqrt(rawPriceMin * ONE_E18)
      const sqrtPriceSpot = bigintSqrt(rawSpotPrice * ONE_E18)
      const sqrtPriceMax = bigintSqrt(rawPriceMax * ONE_E18)

      const maxAvailableBalanceUSDC = parseUnits('1000000', 6)
      const maxAvailableBalanceWETH = parseUnits('400', 18)

      const { actualLt, actualGt } = computeLiquidityFromAmounts(
        maxAvailableBalanceUSDC,
        maxAvailableBalanceWETH,
        sqrtPriceSpot,
        sqrtPriceMin,
        sqrtPriceMax,
      )

      // 999_999.999999 USDC
      expect(actualLt).toBe(999999999999n)
      // 330.119361793776327274 WETH
      expect(actualGt).toBe(330119361793776327274n)
    })

    it('should compute available liquidity for the given price range and one specified amount', () => {
      // USDC < WETH
      const USDC_DECIMALS = 6n
      const WETH_DECIMALS = 18n

      const prices = {
        leftBound: 2000n, // 2000 USDC per 1 WETH
        spotPrice: 2500n, // 2500 USDC per 1 WETH
        rightBound: 3000n, // 3000 USDC per 1 WETH
      }

      const rawPriceMin =
        (10n ** WETH_DECIMALS * ONE_E18) / (prices.rightBound * 10n ** USDC_DECIMALS)
      const rawSpotPrice =
        (10n ** WETH_DECIMALS * ONE_E18) / (prices.spotPrice * 10n ** USDC_DECIMALS)
      const rawPriceMax =
        (10n ** WETH_DECIMALS * ONE_E18) / (prices.leftBound * 10n ** USDC_DECIMALS)

      const sqrtPriceMin = bigintSqrt(rawPriceMin * ONE_E18)
      const sqrtPriceSpot = bigintSqrt(rawSpotPrice * ONE_E18)
      const sqrtPriceMax = bigintSqrt(rawPriceMax * ONE_E18)

      const maxAvailableBalanceWETH = parseUnits('400', 18)

      const { actualLt, actualGt } = computeLiquidityFromAmounts(
        UINT_256_MAX,
        maxAvailableBalanceWETH,
        sqrtPriceSpot,
        sqrtPriceMin,
        sqrtPriceMax,
      )

      // 1_211_682.943485 USDC
      expect(actualLt).toBe(1211682943485n)
      // 399.999999999999998795n WETH
      expect(actualGt).toBe(399999999999999998795n)
    })
  })
})
