// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { ConcentrateLiquidityCalculator } from './concentrate-liquidity-calculator'
import { Price } from '../price'
import { computeLiquidityFromAmounts } from '../concentrate-liquidity-math/concentrate-liquidity-math'

const TOKEN_A = new Address('0x0000000000000000000000000000000000000001')
const TOKEN_B = new Address('0x0000000000000000000000000000000000000002')
const ONE_E18 = 10n ** 18n

const tokenA = { address: TOKEN_A, decimals: 18n, maxAvailableLiquidity: 1000n * ONE_E18 }
const tokenB = { address: TOKEN_B, decimals: 18n, maxAvailableLiquidity: 500n * ONE_E18 }

const pair = {
  tokenA: { address: TOKEN_A, decimals: 18n },
  tokenB: { address: TOKEN_B, decimals: 18n },
}

describe('ConcentrateLiquidityCalculator', () => {
  const minPrice = Price.fromSqrt(9n * 10n ** 17n, pair)
  const spotPrice = Price.fromSqrt(ONE_E18, pair)
  const maxPrice = Price.fromSqrt(11n * 10n ** 17n, pair)
  const prices = { minPrice, spotPrice, maxPrice }

  it('should order token0 and token1 by address', () => {
    const calculator = ConcentrateLiquidityCalculator.new({ tokenA: tokenB, tokenB: tokenA })

    expect(calculator.token0.address.equal(TOKEN_A)).toBe(true)
    expect(calculator.token1.address.equal(TOKEN_B)).toBe(true)
  })

  it('should compute fixed allocation for the lower-address token', () => {
    const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })
    const fixedLt = 100n * ONE_E18
    const allocation = calculator.computeFixedAllocation(prices, TOKEN_A, fixedLt)

    // L = 100 * 1.1 / (1.1 - 1) = 1100 in exact arithmetic; the largest L whose token0 leg fits
    // within the fixed amount is 1099999999999999989011, bGt = L * (1 - 0.9)
    expect(allocation.token0Reserve).toBe(fixedLt)
    expect(allocation.token1Reserve).toBe(109999999999999998901n)
  })

  it('should compute fixed allocation for the higher-address token', () => {
    const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })
    const fixedGt = 80n * ONE_E18
    const allocation = calculator.computeFixedAllocation(prices, TOKEN_B, fixedGt)

    // L = 80 / (1 - 0.9) = 800, bLt = L * (1/1 - 1/1.1) on floored reciprocals
    expect(allocation.token0Reserve).toBe(72727272727272728000n)
    expect(allocation.token1Reserve).toBe(fixedGt)
  })

  describe('fixed allocation in one-sided ranges (spot on a bound)', () => {
    const atMax = { minPrice, spotPrice: maxPrice, maxPrice }
    const atMin = { minPrice, spotPrice: minPrice, maxPrice }

    it('should allocate only token1 when token1 is fixed at spot == maxPrice', () => {
      const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })
      const allocation = calculator.computeFixedAllocation(atMax, TOKEN_B, 100n * ONE_E18)

      expect(allocation).toEqual({ token0Reserve: 0n, token1Reserve: 100n * ONE_E18 })
    })

    it('should allocate only token0 when token0 is fixed at spot == minPrice', () => {
      const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })
      const allocation = calculator.computeFixedAllocation(atMin, TOKEN_A, 100n * ONE_E18)

      expect(allocation).toEqual({ token0Reserve: 100n * ONE_E18, token1Reserve: 0n })
    })

    it('should throw when token0 is fixed at spot == maxPrice', () => {
      const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })

      expect(() => calculator.computeFixedAllocation(atMax, TOKEN_A, 100n * ONE_E18)).toThrow(
        `cannot fix token0 (${TOKEN_A}) amount: the range holds only token1 when spotPrice ` +
          `equals maxPrice, fix the token1 (${TOKEN_B}) amount instead`,
      )
    })

    it('should throw when token1 is fixed at spot == minPrice', () => {
      const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })

      expect(() => calculator.computeFixedAllocation(atMin, TOKEN_B, 100n * ONE_E18)).toThrow(
        `cannot fix token1 (${TOKEN_B}) amount: the range holds only token0 when spotPrice ` +
          `equals minPrice, fix the token0 (${TOKEN_A}) amount instead`,
      )
    })
  })

  it('should compute max allocation from available liquidity', () => {
    const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })
    const allocation = calculator.computeMaxAllocation(prices)
    const expected = computeLiquidityFromAmounts(
      tokenA.maxAvailableLiquidity,
      tokenB.maxAvailableLiquidity,
      spotPrice.toSqrt(),
      minPrice.toSqrt(),
      maxPrice.toSqrt(),
    )

    expect(allocation.token0Reserve).toBe(expected.actualLt)
    expect(allocation.token1Reserve).toBe(expected.actualGt)
  })

  it('should compute spot sqrt price from reserves', () => {
    const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })
    const allocation = calculator.computeMaxAllocation(prices)
    const sqrtSpot = calculator.computeSpotPrice(allocation, { minPrice, maxPrice })

    expect(sqrtSpot).toBeGreaterThan(0n)
  })

  it('should reject inverted price bounds', () => {
    const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })

    expect(() =>
      calculator.computeFixedAllocation(
        { minPrice: maxPrice, spotPrice, maxPrice: minPrice },
        TOKEN_A,
        ONE_E18,
      ),
    ).toThrow()
    expect(() =>
      calculator.computeMaxAllocation({ minPrice: maxPrice, spotPrice, maxPrice: minPrice }),
    ).toThrow()
    expect(() =>
      calculator.computeSpotPrice(
        { token0Reserve: 1n, token1Reserve: 1n },
        { minPrice: maxPrice, maxPrice: minPrice },
      ),
    ).toThrow()
  })
})
