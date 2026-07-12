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
  SingleSidedRangeInfo,
} from './types'
import type { Price } from '../price'
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

  /**
   * Build a single-sided range from a spot price, one price bound and a single reserve.
   *
   * The spot price itself becomes the second bound, so the position holds only the
   * provided token and the opposite reserve is zero by default:
   * - depositing token0: spot = min bound, so `priceBound` must be above the spot
   *   (in sqrt(token1/token0) terms) and becomes the max bound;
   * - depositing token1: spot = max bound, so `priceBound` must be below the spot
   *   and becomes the min bound.
   *
   * @param spotPrice Current spot price; sits exactly on one bound of the range
   * @param priceBound The other bound of the range
   * @param reserveForToken Token being deposited (must be one of the pair tokens)
   * @param reserve Raw amount of `reserveForToken` to deposit (must be positive)
   */
  computeSingleSidedRange(
    spotPrice: Price,
    priceBound: Price,
    reserveForToken: Address,
    reserve: bigint,
  ): SingleSidedRangeInfo {
    assert(reserve > 0n, 'reserve must be positive')
    assert(
      spotPrice.token0.address.equal(this.token0.address) &&
        spotPrice.token1.address.equal(this.token1.address),
      'prices should be for the calculator token pair',
    )
    assert(
      reserveForToken.equal(this.token0.address) || reserveForToken.equal(this.token1.address),
      'reserve should be in some pair token',
    )

    const isReserveLt = reserveForToken.equal(this.token0.address)

    if (isReserveLt) {
      assert(priceBound.gt(spotPrice), 'price bound should be above spot for a token0 deposit')

      return {
        prices: { minPrice: spotPrice, spotPrice, maxPrice: priceBound },
        reserves: { token0Reserve: reserve, token1Reserve: 0n },
      }
    }

    assert(priceBound.lt(spotPrice), 'price bound should be below spot for a token1 deposit')

    return {
      prices: { minPrice: priceBound, spotPrice, maxPrice: spotPrice },
      reserves: { token0Reserve: 0n, token1Reserve: reserve },
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
