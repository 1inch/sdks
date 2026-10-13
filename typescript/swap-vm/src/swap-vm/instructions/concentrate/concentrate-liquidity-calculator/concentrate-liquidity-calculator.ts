// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import assert from 'assert'
import type {
  ConcentratedLiquidityInfo,
  ConcentrateLiquidityCalculatorArgs,
  ConcentrateTokenInfo,
  PriceAllocationRange,
  PriceBounds,
} from './types'
import {
  computeBalances,
  computeLiquidityAndPrice,
  computeLiquidityFromAmounts,
  computeLiquidityFromGt,
  computeLiquidityFromLt,
} from '../concentrate-liquidity-math/concentrate-liquidity-math'

export class ConcentrateLiquidityCalculator {
  constructor(
    private readonly tokenA: ConcentrateTokenInfo,
    private readonly tokenB: ConcentrateTokenInfo,
  ) {}

  /**
   * Token with the smaller address (token0 in pool convention; "Lt" in the math).
   */
  get token0(): ConcentrateTokenInfo {
    return this.tokenA.address.lt(this.tokenB.address) ? this.tokenA : this.tokenB
  }

  /**
   * Token with the larger address (token1 in pool convention; "Gt" in the math).
   */
  get token1(): ConcentrateTokenInfo {
    return this.tokenA.address.lt(this.tokenB.address) ? this.tokenB : this.tokenA
  }

  static new(data: ConcentrateLiquidityCalculatorArgs): ConcentrateLiquidityCalculator {
    return new ConcentrateLiquidityCalculator(data.tokenA, data.tokenB)
  }

  computeFixedAllocation(
    prices: PriceAllocationRange,
    fixedReserveForToken: Address,
    fixedReserve: bigint,
  ): ConcentratedLiquidityInfo {
    assert(prices.maxPrice.gte(prices.spotPrice), 'maxPrice should be >= spotPrice')
    assert(prices.spotPrice.gte(prices.minPrice), 'spotPrice should be >= minPrice')

    const isFixedLt = fixedReserveForToken.equal(this.token0.address)

    if (isFixedLt) {
      assert(
        prices.spotPrice.lt(prices.maxPrice),
        `cannot fix token0 (${this.token0.address}) amount: the range holds only token1 ` +
          `when spotPrice equals maxPrice, fix the token1 (${this.token1.address}) amount instead`,
      )
    } else {
      assert(
        prices.spotPrice.gt(prices.minPrice),
        `cannot fix token1 (${this.token1.address}) amount: the range holds only token0 ` +
          `when spotPrice equals minPrice, fix the token0 (${this.token0.address}) amount instead`,
      )
    }

    const sqrtPspot = prices.spotPrice.toSqrt()
    const sqrtPmin = prices.minPrice.toSqrt()
    const sqrtPmax = prices.maxPrice.toSqrt()

    const liquidity = isFixedLt
      ? computeLiquidityFromLt(fixedReserve, sqrtPspot, sqrtPmax)
      : computeLiquidityFromGt(fixedReserve, sqrtPspot, sqrtPmin)

    const { bLt, bGt } = computeBalances(liquidity, sqrtPspot, sqrtPmin, sqrtPmax)

    return {
      token0Reserve: bLt,
      token1Reserve: bGt,
    }
  }

  computeMaxAllocation(prices: PriceAllocationRange): ConcentratedLiquidityInfo {
    assert(prices.maxPrice.gte(prices.spotPrice), 'maxPrice should be >= spotPrice')
    assert(prices.spotPrice.gte(prices.minPrice), 'spotPrice should be >= minPrice')

    const { actualLt, actualGt } = computeLiquidityFromAmounts(
      this.token0.maxAvailableLiquidity,
      this.token1.maxAvailableLiquidity,
      prices.spotPrice.toSqrt(),
      prices.minPrice.toSqrt(),
      prices.maxPrice.toSqrt(),
    )

    return {
      token0Reserve: actualLt,
      token1Reserve: actualGt,
    }
  }

  computeSpotPrice(reserves: ConcentratedLiquidityInfo, bounds: PriceBounds): bigint {
    assert(bounds.maxPrice.gte(bounds.minPrice), 'maxPrice should be >= minPrice')

    const { sqrtPriceSpot } = computeLiquidityAndPrice(
      reserves.token0Reserve,
      reserves.token1Reserve,
      bounds.minPrice.toSqrt(),
      bounds.maxPrice.toSqrt(),
    )

    return sqrtPriceSpot
  }
}
