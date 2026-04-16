// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import type {
  ConcentratedLiquidityInfo,
  ConcentrateLiquidityCalculatorArgs,
  ConcentrateTokenInfo,
  PriceAllocationRange,
  PriceBounds,
} from './types'
import type { Price, PriceTokenRef } from '../price'
import {
  computeLiquidityAndPrice,
  computeLiquidityFromAmounts,
} from '../concentrate-liquidity-math/concentrate-liquidity-math'

/**
 * Calculator for concentrated liquidity: given two tokens and a price range (min, spot, max),
 * computes sqrt prices and token reserves for "max allocation" (use all available balances)
 * or "fixed allocation" (fix one token amount and solve for the other).
 *
 * Token ordering follows the pool convention: token0 = lower address, token1 = higher address.
 * Prices are supplied as {@link Price} values ({@link PriceAllocationRange}).
 * Range endpoints are **economic** min/max (lower vs higher human quote-per-base); sqrt bounds are
 * derived inside the calculator.
 */
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

  /**
   * Compute reserves when one token amount is fixed: the position uses exactly
   * `fixedReserve` of `fixedReserveForToken` and the other token amount is derived
   * to keep the same liquidity L. Returns sqrt prices and token0/token1
   * reserves (smallest-unit amounts).
   * Due to integer math (floor division, sqrt), the fixed asset amount in the result
   * may be less than requested by a few wei.
   */
  computeFixedAllocation(
    prices: PriceAllocationRange,
    fixedReserveForToken: Address,
    fixedReserve: bigint,
  ): ConcentratedLiquidityInfo {
    const { minP, spotP, maxP } = this.resolvePriceTriple(prices)

    const isFixedLt = fixedReserveForToken.equal(this.token0.address)

    const availableLt = isFixedLt ? fixedReserve : UINT_256_MAX
    const availableGt = isFixedLt ? UINT_256_MAX : fixedReserve

    return this.allocateWithAvailability(availableLt, availableGt, minP, spotP, maxP)
  }

  /**
   * Compute reserves when both token amounts are taken from token info: uses
   * token0.maxAvailableLiquidity and token1.maxAvailableLiquidity to maximize
   * L. Returns sqrt prices and the token0/token1 reserves that achieve
   * that maximum.
   */
  computeMaxAllocation(prices: PriceAllocationRange): ConcentratedLiquidityInfo {
    const { minP, spotP, maxP } = this.resolvePriceTriple(prices)

    return this.allocateWithAvailability(
      this.token0.maxAvailableLiquidity,
      this.token1.maxAvailableLiquidity,
      minP,
      spotP,
      maxP,
    )
  }

  /**
   * Implied spot sqrt price from token0/token1 balances and a price range.
   *
   * @returns sqrt(P_spot) in 1e18 fixed-point (same as {@link ConcentratedLiquidityInfo.sqrtPriceSpot}).
   */
  computeSpotPrice(token0Balance: bigint, token1Balance: bigint, bounds: PriceBounds): bigint {
    const { sqrtPriceMin, sqrtPriceMax } = this.resolvePriceBounds(bounds)

    const { sqrtPriceSpot } = computeLiquidityAndPrice(
      token0Balance,
      token1Balance,
      sqrtPriceMin,
      sqrtPriceMax,
    )

    return sqrtPriceSpot
  }

  private resolvePriceTriple(prices: PriceAllocationRange): {
    minP: Price
    spotP: Price
    maxP: Price
  } {
    this.assertPricesMatchPair(prices.minPrice, prices.spotPrice, prices.maxPrice)

    return {
      minP: prices.minPrice,
      spotP: prices.spotPrice,
      maxP: prices.maxPrice,
    }
  }

  private resolvePriceBounds(bounds: PriceBounds): {
    sqrtPriceMin: bigint
    sqrtPriceMax: bigint
  } {
    this.assertPricesMatchPair(bounds.minPrice, bounds.maxPrice)

    const s0 = bounds.minPrice.toSqrtFixed()
    const s1 = bounds.maxPrice.toSqrtFixed()

    return {
      sqrtPriceMin: s0 < s1 ? s0 : s1,
      sqrtPriceMax: s0 < s1 ? s1 : s0,
    }
  }

  private allocateWithAvailability(
    availableLt: bigint,
    availableGt: bigint,
    minP: Price,
    spotP: Price,
    maxP: Price,
  ): ConcentratedLiquidityInfo {
    this.assertPricesMatchPair(minP, spotP, maxP)

    const sqrtA = minP.toSqrtFixed()
    const sqrtB = maxP.toSqrtFixed()
    const sqrtPriceMin = sqrtA < sqrtB ? sqrtA : sqrtB
    const sqrtPriceMax = sqrtA < sqrtB ? sqrtB : sqrtA
    const sqrtPriceSpot = spotP.toSqrtFixed()

    const { actualLt, actualGt } = computeLiquidityFromAmounts(
      availableLt,
      availableGt,
      sqrtPriceSpot,
      sqrtPriceMin,
      sqrtPriceMax,
    )

    return {
      sqrtPriceMin,
      sqrtPriceSpot,
      sqrtPriceMax,
      token0Reserve: actualLt,
      token1Reserve: actualGt,
    }
  }

  private assertPricesMatchPair(...prices: Price[]): void {
    for (const p of prices) {
      if (!this.priceMatchesCalculatorTokens(p)) {
        throw new Error('unknown quote token')
      }
    }
  }

  private priceMatchesCalculatorTokens(p: Price): boolean {
    const match = (t: ConcentrateTokenInfo, r: PriceTokenRef): boolean =>
      t.address.equal(r.address) && t.decimals === r.decimals

    return (
      (match(this.tokenA, p.quoteToken) && match(this.tokenB, p.baseToken)) ||
      (match(this.tokenA, p.baseToken) && match(this.tokenB, p.quoteToken))
    )
  }
}
