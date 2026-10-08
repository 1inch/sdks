// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { expect } from 'vitest'
import { parseUnits } from 'viem'
import { UINT_256_MAX } from '@1inch/byte-utils'
import {
  computeBalances,
  computeLiquidityAndPrice,
  computeLiquidityFromAmounts,
  computeLiquidityFromGt,
  computeLiquidityFromLt,
} from './concentrate-liquidity-math'
import { ONE_E18 } from '../concentrate-grow-liquidity-2d-args'
import { bigintSqrt } from '../../utils/bigint-sqrt'

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

      // bLt = L * (1/sqrtPspot - 1/sqrtPmax): invSqrtPspot = 1e18, invSqrtPmax = floor(1e36 / 1.1e18)
      //       = 909090909090909090, so bLt = L * 90909090909090910 / 1e18
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

      expect(result.targetL).toBe(5000000000000000000000n)
      expect(result.actualLt).toBe(bLt)
      expect(result.actualGt).toBe(1000000000000000000000n)
    })

    it('should compute bLt from reciprocal sqrt prices for a cheap tokenLt (sqrtP ~ 1e9)', () => {
      // 18-decimal tokenLt at ~1.4e-6 of a 6-decimal tokenGt: sqrtPspot ~ 1.18e9, so
      // sqrtPmax * sqrtPspot ~ 1.7e18 and the stale product form truncated its denominator
      // to 1 wei, overstating bLt ~1.5e9-fold. Values verified against the pinned contract
      // (tests/concentrate-math.spec.ts, cheapToken0 regime).
      const sqrtPspot = bigintSqrt(14n * 10n ** 17n)
      const sqrtPmin = bigintSqrt(112n * 10n ** 16n)
      const sqrtPmax = bigintSqrt(168n * 10n ** 16n)

      const { bLt, bGt } = computeBalances(10n ** 24n, sqrtPspot, sqrtPmin, sqrtPmax)

      expect(bLt).toBe(73637504955161671474575031000000n)
      expect(bGt).toBe(124915432000000n)
    })

    it('should not throw when sqrtPmax * sqrtPspot < 1e18 (the stale form divided by zero)', () => {
      const { bLt, bGt } = computeBalances(10n ** 24n, 500_000_000n, 400_000_000n, 600_000_000n)

      // Verified against the pinned contract (tests/concentrate-math.spec.ts, subOneProduct regime)
      expect(bLt).toBe(333333333333333333333333334000000n)
      expect(bGt).toBe(100000000000000n)
    })
  })

  describe('round-trip: reserves computed for a target spot re-derive that spot', () => {
    const cases = [
      {
        name: 'same-decimals pair around parity (sqrtP ~ 1e18)',
        sqrtPspot: ONE_E18,
        sqrtPmin: 9n * 10n ** 17n,
        sqrtPmax: 11n * 10n ** 17n,
      },
      {
        name: 'USDC/WETH-like (6dp/18dp, sqrtP ~ 2e22)',
        sqrtPspot: bigintSqrt((10n ** 36n * ONE_E18) / (2500n * 10n ** 6n)),
        sqrtPmin: bigintSqrt((10n ** 36n * ONE_E18) / (3000n * 10n ** 6n)),
        sqrtPmax: bigintSqrt((10n ** 36n * ONE_E18) / (2000n * 10n ** 6n)),
      },
      {
        name: 'cheap tokenLt (18dp/6dp at 1.4e-6, sqrtP ~ 1.18e9)',
        sqrtPspot: bigintSqrt(14n * 10n ** 17n),
        sqrtPmin: bigintSqrt(112n * 10n ** 16n),
        sqrtPmax: bigintSqrt(168n * 10n ** 16n),
      },
      {
        name: 'sqrtPmax * sqrtPspot < 1e18',
        sqrtPspot: 500_000_000n,
        sqrtPmin: 400_000_000n,
        sqrtPmax: 600_000_000n,
      },
    ]

    for (const { name, sqrtPspot, sqrtPmin, sqrtPmax } of cases) {
      it(`re-derives the target spot within tolerance: ${name}`, () => {
        const { bLt, bGt } = computeBalances(10n ** 24n, sqrtPspot, sqrtPmin, sqrtPmax)
        const { sqrtPriceSpot } = computeLiquidityAndPrice(bLt, bGt, sqrtPmin, sqrtPmax)

        const drift =
          sqrtPriceSpot >= sqrtPspot ? sqrtPriceSpot - sqrtPspot : sqrtPspot - sqrtPriceSpot

        // Integer truncation may move the implied sqrt spot by dust only: a few wei, and in any
        // case <= 1e-12 relative. The stale product form missed the target by ~1e-2 relative in
        // the cheap-tokenLt regime.
        const allowed = sqrtPspot / 10n ** 12n

        expect(drift).toBeLessThanOrEqual(allowed > 10n ? allowed : 10n)
      })
    }
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

      expect(actualLt).toBe(100000000000000001000n)
      expect(actualGt).toBe(110000000000000000000n)
      expect(targetL).toBe(1100000000000000000000n)
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

    it('when Lt is limiting, actualLt matches availableLt within a few wei (contract rounding)', () => {
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

      expect(targetL).toBe(550000000000000000000n)
      // The reciprocal form can round the limiting token a few wei ABOVE the available amount;
      // the deployed contract's computeLiquidityFromAmounts returns the identical value.
      expect(actualLt).toBe(50000000000000000500n)
      expect(actualGt).toBe(55000000000000000000n)
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
      expect(targetL).toBe(495000000000000000000n)
      expect(actualLt).toBe(100000000000000000395n)
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
      expect(result.targetL).toBe(1000000000000000000n)
      expect(result.actualLt).toBe(bLt)
      expect(result.actualGt).toBe(100000000000000000n)
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

      // 1_000_000.000000 USDC
      expect(actualLt).toBe(1000000000000n)
      // 330.119361793825978647 WETH
      expect(actualGt).toBe(330119361793825978647n)
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

    it('should reject inverted price bounds', () => {
      expect(() => computeLiquidityFromAmounts(1n, 1n, ONE_E18, ONE_E18, ONE_E18)).toThrow(
        'sqrtPmax should be greater than sqrtPmin',
      )
      expect(() => computeBalances(1n, ONE_E18, ONE_E18, ONE_E18)).toThrow(
        'sqrtPmax should be greater than sqrtPmin',
      )
    })
  })

  describe('computeLiquidityFromLt', () => {
    const sqrtPmin = 9n * 10n ** 17n
    const sqrtPmax = 11n * 10n ** 17n

    it('should compute L = availableLt * (sqrtPmax * sqrtPspot / ONE) / (sqrtPmax - sqrtPspot)', () => {
      // 100 * 1.1 / (1.1 - 1)
      expect(computeLiquidityFromLt(100n * ONE_E18, ONE_E18, sqrtPmax)).toBe(1100n * ONE_E18)
    })

    it('should match targetL of computeLiquidityFromAmounts when tokenLt is limiting', () => {
      const availableLt = 50n * ONE_E18
      const { targetL } = computeLiquidityFromAmounts(
        availableLt,
        10_000n * ONE_E18,
        ONE_E18,
        sqrtPmin,
        sqrtPmax,
      )

      expect(computeLiquidityFromLt(availableLt, ONE_E18, sqrtPmax)).toBe(targetL)
    })

    it('should accept spot at the min bound, where the range holds only tokenLt', () => {
      const availableLt = 100n * ONE_E18
      const targetL = computeLiquidityFromLt(availableLt, sqrtPmin, sqrtPmax)

      expect(targetL).toBe(495n * ONE_E18)
      expect(computeBalances(targetL, sqrtPmin, sqrtPmin, sqrtPmax)).toEqual({
        bLt: availableLt,
        bGt: 0n,
      })
    })

    it('should return 0 for a zero amount', () => {
      expect(computeLiquidityFromLt(0n, ONE_E18, sqrtPmax)).toBe(0n)
    })

    it('should throw when spot is at or above the max bound (range holds no tokenLt)', () => {
      expect(() => computeLiquidityFromLt(100n * ONE_E18, sqrtPmax, sqrtPmax)).toThrow(
        'sqrtPspot should be less than sqrtPmax',
      )
      expect(() => computeLiquidityFromLt(100n * ONE_E18, sqrtPmax + 1n, sqrtPmax)).toThrow(
        'sqrtPspot should be less than sqrtPmax',
      )
    })
  })

  describe('computeLiquidityFromGt', () => {
    const sqrtPmin = 9n * 10n ** 17n
    const sqrtPmax = 11n * 10n ** 17n

    it('should compute L = availableGt * ONE / (sqrtPspot - sqrtPmin)', () => {
      // 25 / (1 - 0.9)
      expect(computeLiquidityFromGt(25n * ONE_E18, ONE_E18, sqrtPmin)).toBe(250n * ONE_E18)
    })

    it('should match targetL of computeLiquidityFromAmounts when tokenGt is limiting', () => {
      const availableGt = 25n * ONE_E18
      const { targetL } = computeLiquidityFromAmounts(
        10_000n * ONE_E18,
        availableGt,
        ONE_E18,
        sqrtPmin,
        sqrtPmax,
      )

      expect(computeLiquidityFromGt(availableGt, ONE_E18, sqrtPmin)).toBe(targetL)
    })

    it('should accept spot at the max bound, where the range holds only tokenGt', () => {
      const availableGt = 100n * ONE_E18
      const targetL = computeLiquidityFromGt(availableGt, sqrtPmax, sqrtPmin)

      expect(targetL).toBe(500n * ONE_E18)
      expect(computeBalances(targetL, sqrtPmax, sqrtPmin, sqrtPmax)).toEqual({
        bLt: 0n,
        bGt: availableGt,
      })
    })

    it('should return 0 for a zero amount', () => {
      expect(computeLiquidityFromGt(0n, ONE_E18, sqrtPmin)).toBe(0n)
    })

    it('should throw when spot is at or below the min bound (range holds no tokenGt)', () => {
      expect(() => computeLiquidityFromGt(100n * ONE_E18, sqrtPmin, sqrtPmin)).toThrow(
        'sqrtPspot should be greater than sqrtPmin',
      )
      expect(() => computeLiquidityFromGt(100n * ONE_E18, sqrtPmin - 1n, sqrtPmin)).toThrow(
        'sqrtPspot should be greater than sqrtPmin',
      )
    })

    it('should derive the full allocation from one fixed tokenGt amount', () => {
      // USDC < WETH, range 2000 -> 3000 USDC per 1 WETH, spot 2500
      const toSqrt = (usdcPerWeth: bigint): bigint =>
        bigintSqrt(((10n ** 18n * ONE_E18) / (usdcPerWeth * 10n ** 6n)) * ONE_E18)
      const sqrtPriceMin = toSqrt(3000n)
      const sqrtPriceSpot = toSqrt(2500n)
      const sqrtPriceMax = toSqrt(2000n)

      const targetL = computeLiquidityFromGt(parseUnits('400', 18), sqrtPriceSpot, sqrtPriceMin)
      const { bLt, bGt } = computeBalances(targetL, sqrtPriceSpot, sqrtPriceMin, sqrtPriceMax)

      // 1_211_682.943485 USDC
      expect(bLt).toBe(1211682943485n)
      // 399.999999999999998795 WETH
      expect(bGt).toBe(399999999999999998795n)
    })
  })
})
