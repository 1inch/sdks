// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import assert from 'assert'
import type {
  ConcentratedLiquidityInfo,
  ConcentrateLiquidityCalculatorArgs,
  ConcentrateTokenInfo,
  PriceAllocationRange,
  PriceBounds,
} from './types'
import {
  computeLiquidityAndPrice,
  computeLiquidityFromAmounts,
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

    const availableLt = isFixedLt ? fixedReserve : UINT_256_MAX
    const availableGt = isFixedLt ? UINT_256_MAX : fixedReserve

    const { actualLt, actualGt } = computeLiquidityFromAmounts(
      availableLt,
      availableGt,
      prices.spotPrice.toSqrt(),
      prices.minPrice.toSqrt(),
      prices.maxPrice.toSqrt(),
    )

    return {
      token0Reserve: actualLt,
      token1Reserve: actualGt,
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
