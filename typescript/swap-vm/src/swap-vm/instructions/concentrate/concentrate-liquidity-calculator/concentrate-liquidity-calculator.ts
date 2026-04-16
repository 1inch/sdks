// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import type {
  ConcentratedLiquidityInfo,
  ConcentrateLiquidityCalculatorArgs,
  ConcentrateTokenInfo,
  ScaledPriceBounds,
  ScaledPrices,
} from './types'
import { bigintSqrt } from '../bigint-sqrt'
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
 * Prices are supplied as ScaledPrices with scale 10^(token0Decimals + token1Decimals); they are
 * converted internally to P = token1/token0 in 1e18 and then to sqrt(P * 1e18) for the math.
 */
export class ConcentrateLiquidityCalculator {
  static readonly ONE_E18 = 10n ** 18n

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
   * reserves (raw amounts).
   * Due to integer math (floor division, sqrt), the fixed asset amount in the result
   * may be less than requested by a few wei.
   */
  computeFixedAllocation(
    scaledPrices: ScaledPrices,
    fixedReserveForToken: Address,
    fixedReserve: bigint,
  ): ConcentratedLiquidityInfo {
    const { minPriceRaw, spotPriceRaw, maxPriceRaw } = this.computeRawPrices(scaledPrices)

    const sqrtPriceMin = bigintSqrt(minPriceRaw * ConcentrateLiquidityCalculator.ONE_E18)
    const sqrtPriceSpot = bigintSqrt(spotPriceRaw * ConcentrateLiquidityCalculator.ONE_E18)
    const sqrtPriceMax = bigintSqrt(maxPriceRaw * ConcentrateLiquidityCalculator.ONE_E18)

    const isFixedLt = fixedReserveForToken.equal(this.token0.address)

    const availableLt = isFixedLt ? fixedReserve : UINT_256_MAX
    const availableGt = isFixedLt ? UINT_256_MAX : fixedReserve

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

  /**
   * Compute reserves when both token amounts are taken from token info: uses
   * token0.maxAvailableLiquidity and token1.maxAvailableLiquidity to maximize
   * L. Returns sqrt prices and the token0/token1 reserves that achieve
   * that maximum.
   */
  computeMaxAllocation(scaledPrices: ScaledPrices): ConcentratedLiquidityInfo {
    const { minPriceRaw, spotPriceRaw, maxPriceRaw } = this.computeRawPrices(scaledPrices)

    const sqrtPriceMin = bigintSqrt(minPriceRaw * ConcentrateLiquidityCalculator.ONE_E18)
    const sqrtPriceSpot = bigintSqrt(spotPriceRaw * ConcentrateLiquidityCalculator.ONE_E18)
    const sqrtPriceMax = bigintSqrt(maxPriceRaw * ConcentrateLiquidityCalculator.ONE_E18)

    const { actualLt, actualGt } = computeLiquidityFromAmounts(
      this.token0.maxAvailableLiquidity,
      this.token1.maxAvailableLiquidity,
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

  /**
   * Implied spot sqrt price from token0/token1 balances and a scaled price range
   * (same convention as {@link computeMaxAllocation}). Inverse of the allocation math; wraps
   * {@link computeLiquidityAndPrice} from concentrate-liquidity-math.
   *
   * @returns sqrt(P_spot) in 1e18 fixed-point (same as {@link ConcentratedLiquidityInfo.sqrtPriceSpot}).
   */
  computeSpotPrice(
    token0Balance: bigint,
    token1Balance: bigint,
    scaledPriceBounds: ScaledPriceBounds,
  ): bigint {
    const { sqrtPriceMin, sqrtPriceMax } = this.computeSqrtPriceBounds(scaledPriceBounds)

    const { sqrtPriceSpot } = computeLiquidityAndPrice(
      token0Balance,
      token1Balance,
      sqrtPriceMin,
      sqrtPriceMax,
    )

    return sqrtPriceSpot
  }

  /**
   * Convert user-facing ScaledPrices (scale 10^(token0Decimals+token1Decimals)) into internal
   * raw prices P = token1/token0 (before sqrt), so that sqrt(P * 1e18) can be
   * passed to the liquidity math. Handles both quote = token0 and quote = token1.
   */
  private computeRawPrices(scaledPrices: ScaledPrices): {
    minPriceRaw: bigint
    spotPriceRaw: bigint
    maxPriceRaw: bigint
  } {
    const { minPriceRaw, maxPriceRaw } = this.computeRawPriceBounds(scaledPrices)

    const token0 = this.token0
    const token1 = this.token1

    if (scaledPrices.quoteToken.equal(token0.address)) {
      const numerator =
        10n ** (token1.decimals + token1.decimals) * ConcentrateLiquidityCalculator.ONE_E18

      return {
        minPriceRaw,
        spotPriceRaw: numerator / scaledPrices.spotPriceRaw,
        maxPriceRaw,
      }
    }

    if (scaledPrices.quoteToken.equal(token1.address)) {
      const denominator = 10n ** (token0.decimals + token0.decimals)

      return {
        minPriceRaw,
        spotPriceRaw:
          (scaledPrices.spotPriceRaw * ConcentrateLiquidityCalculator.ONE_E18) / denominator,
        maxPriceRaw,
      }
    }

    throw new Error('unknown quote token')
  }

  private computeSqrtPriceBounds(scaledPriceBounds: ScaledPriceBounds): {
    sqrtPriceMin: bigint
    sqrtPriceMax: bigint
  } {
    const { minPriceRaw, maxPriceRaw } = this.computeRawPriceBounds(scaledPriceBounds)

    return {
      sqrtPriceMin: bigintSqrt(minPriceRaw * ConcentrateLiquidityCalculator.ONE_E18),
      sqrtPriceMax: bigintSqrt(maxPriceRaw * ConcentrateLiquidityCalculator.ONE_E18),
    }
  }

  /**
   * Internal P = token1/token0 (1e18) from scaled min/max only (same mapping as {@link computeRawPrices}).
   */
  private computeRawPriceBounds(scaledPriceBounds: ScaledPriceBounds): {
    minPriceRaw: bigint
    maxPriceRaw: bigint
  } {
    const token0 = this.token0
    const token1 = this.token1

    if (scaledPriceBounds.quoteToken.equal(token0.address)) {
      const numerator =
        10n ** (token1.decimals + token1.decimals) * ConcentrateLiquidityCalculator.ONE_E18

      return {
        minPriceRaw: numerator / scaledPriceBounds.maxPriceRaw,
        maxPriceRaw: numerator / scaledPriceBounds.minPriceRaw,
      }
    }

    if (scaledPriceBounds.quoteToken.equal(token1.address)) {
      const denominator = 10n ** (token0.decimals + token0.decimals)

      return {
        minPriceRaw:
          (scaledPriceBounds.minPriceRaw * ConcentrateLiquidityCalculator.ONE_E18) / denominator,
        maxPriceRaw:
          (scaledPriceBounds.maxPriceRaw * ConcentrateLiquidityCalculator.ONE_E18) / denominator,
      }
    }

    throw new Error('unknown quote token')
  }
}
