// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
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
    const expected = computeLiquidityFromAmounts(
      fixedLt,
      UINT_256_MAX,
      spotPrice.toSqrt(),
      minPrice.toSqrt(),
      maxPrice.toSqrt(),
    )

    expect(allocation.token0Reserve).toBe(expected.actualLt)
    expect(allocation.token1Reserve).toBe(expected.actualGt)
  })

  it('should compute fixed allocation for the higher-address token', () => {
    const calculator = ConcentrateLiquidityCalculator.new({ tokenA, tokenB })
    const fixedGt = 80n * ONE_E18
    const allocation = calculator.computeFixedAllocation(prices, TOKEN_B, fixedGt)
    const expected = computeLiquidityFromAmounts(
      UINT_256_MAX,
      fixedGt,
      spotPrice.toSqrt(),
      minPrice.toSqrt(),
      maxPrice.toSqrt(),
    )

    expect(allocation.token0Reserve).toBe(expected.actualLt)
    expect(allocation.token1Reserve).toBe(expected.actualGt)
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
