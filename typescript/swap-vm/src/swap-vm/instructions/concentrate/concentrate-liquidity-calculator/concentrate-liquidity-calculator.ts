// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import type {
  ConcentratedLiquidityInfo,
  ConcentrateLiquidityCalculatorArgs,
  ConcentrateTokenInfo,
  ScaledPrices,
} from './types'
import { bigintSqrt } from '../bigint-sqrt'
import { computeLiquidityFromAmounts } from '../concentrate-liquidity-math/concentrate-liquidity-math'

export class ConcentrateLiquidityCalculator {
  static readonly ONE_E18 = 10n ** 18n

  constructor(
    private readonly tokenA: ConcentrateTokenInfo,
    private readonly tokenB: ConcentrateTokenInfo,
  ) {}

  get token0(): ConcentrateTokenInfo {
    return this.tokenA.address.lt(this.tokenB.address) ? this.tokenA : this.tokenB
  }

  get token1(): ConcentrateTokenInfo {
    return this.tokenA.address.lt(this.tokenB.address) ? this.tokenB : this.tokenA
  }

  static new(data: ConcentrateLiquidityCalculatorArgs): ConcentrateLiquidityCalculator {
    return new ConcentrateLiquidityCalculator(data.tokenA, data.tokenB)
  }

  computeFixedAllocation(
    scaledPrices: ScaledPrices,
    fixedReserveForToken: Address,
    fixedReserve: bigint,
  ): ConcentratedLiquidityInfo {
    const { rawPriceMin, rawPriceSpot, rawPriceMax } = this.computeRawPrices(scaledPrices)

    const sqrtPriceMin = bigintSqrt(rawPriceMin * ConcentrateLiquidityCalculator.ONE_E18)
    const sqrtPriceSpot = bigintSqrt(rawPriceSpot * ConcentrateLiquidityCalculator.ONE_E18)
    const sqrtPriceMax = bigintSqrt(rawPriceMax * ConcentrateLiquidityCalculator.ONE_E18)

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

  computeMaxAllocation(scaledPrices: ScaledPrices): ConcentratedLiquidityInfo {
    const { rawPriceMin, rawPriceSpot, rawPriceMax } = this.computeRawPrices(scaledPrices)

    const sqrtPriceMin = bigintSqrt(rawPriceMin * ConcentrateLiquidityCalculator.ONE_E18)
    const sqrtPriceSpot = bigintSqrt(rawPriceSpot * ConcentrateLiquidityCalculator.ONE_E18)
    const sqrtPriceMax = bigintSqrt(rawPriceMax * ConcentrateLiquidityCalculator.ONE_E18)

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

  private computeRawPrices(scaledPrices: ScaledPrices): {
    rawPriceMin: bigint
    rawPriceSpot: bigint
    rawPriceMax: bigint
  } {
    const token0 = this.token0
    const token1 = this.token1

    if (scaledPrices.quoteToken.equal(token0.address)) {
      const numerator = 10n ** token1.decimals * ConcentrateLiquidityCalculator.ONE_E18

      return {
        rawPriceMin: numerator / scaledPrices.maxPriceRaw,
        rawPriceSpot: numerator / scaledPrices.spotPriceRaw,
        rawPriceMax: numerator / scaledPrices.minPriceRaw,
      }
    }

    if (scaledPrices.quoteToken.equal(token1.address)) {
      return {
        rawPriceMin: scaledPrices.minPriceRaw * ConcentrateLiquidityCalculator.ONE_E18,
        rawPriceSpot: scaledPrices.spotPriceRaw * ConcentrateLiquidityCalculator.ONE_E18,
        rawPriceMax: scaledPrices.minPriceRaw * ConcentrateLiquidityCalculator.ONE_E18,
      }
    }

    throw new Error('unknown quote token')
  }
}
