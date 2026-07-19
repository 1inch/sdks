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
import { Price } from '../price'
import { ONE_E18 } from '../concentrate-grow-liquidity-2d-args'
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
   * Build a single-sided price range from a spot price and a single reserve.
   *
   * The spot price sits exactly on one bound (the position holds only the provided
   * token, the opposite reserve is zero):
   * - depositing token0: spot = min bound (in sqrt(token1/token0) terms);
   * - depositing token1: spot = max bound.
   *
   * The opposite bound is derived from the other token's `maxAvailableLiquidity`:
   * it is the price at which the deposited reserve has fully converted into exactly
   * that amount. This follows from the range-order relation
   * `sqrtPmin * sqrtPmax / 1e18^2 = amountGt / amountLt` (the geometric mean of the
   * bounds is the average execution price across the range), so the opposite token's
   * `maxAvailableLiquidity` must exceed the spot-equivalent value of the deposit.
   *
   * @param spotPrice Current spot price; sits exactly on one bound of the range
   * @param reserveForToken Token being deposited (must be one of the pair tokens)
   * @param reserve Raw amount of `reserveForToken` to deposit (must be positive)
   * @returns Price range with the spot on one bound and the derived opposite bound
   */
  computeSingleSidedRange(
    spotPrice: Price,
    reserveForToken: Address,
    reserve: bigint,
  ): PriceAllocationRange {
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
    const sqrtPspot = spotPrice.toSqrt()
    const pair = { tokenA: spotPrice.token0, tokenB: spotPrice.token1 }

    if (isReserveLt) {
      const targetGt = this.token1.maxAvailableLiquidity
      const sqrtPmax = (targetGt * ONE_E18 * ONE_E18) / (reserve * sqrtPspot)
      assert(
        sqrtPmax > sqrtPspot,
        'token1 maxAvailableLiquidity should exceed the spot value of the deposit',
      )

      return {
        minPrice: spotPrice,
        spotPrice,
        maxPrice: Price.fromSqrt(sqrtPmax, pair),
      }
    }

    const targetLt = this.token0.maxAvailableLiquidity
    assert(targetLt > 0n, 'token0 maxAvailableLiquidity must be positive')

    const sqrtPmin = (reserve * ONE_E18 * ONE_E18) / (targetLt * sqrtPspot)
    assert(
      sqrtPmin > 0n && sqrtPmin < sqrtPspot,
      'token0 maxAvailableLiquidity should exceed the spot value of the deposit',
    )

    return {
      minPrice: Price.fromSqrt(sqrtPmin, pair),
      spotPrice,
      maxPrice: spotPrice,
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
