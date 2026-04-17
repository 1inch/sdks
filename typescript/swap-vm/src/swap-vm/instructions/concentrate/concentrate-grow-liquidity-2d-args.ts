// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import assert from 'assert'
import { ConcentrateGrowLiquidity2DArgsCoder } from './concentrate-grow-liquidity-2d-args-coder'
import { bigintSqrt } from './bigint-sqrt'
import type { IArgsCoder, IArgsData } from '../types'

export const ONE_E18: bigint = 10n ** 18n

/**
 * Arguments for concentrateGrowLiquidity2D instruction
 * Contract encodes sqrtPriceMin and sqrtPriceMax (2 × uint256, 64 bytes)
 * P = tokenGt/tokenLt; sqrt(P) in 1e18 fixed-point
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/XYCConcentrate.sol#L172
 **/
export class ConcentrateGrowLiquidity2DArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<ConcentrateGrowLiquidity2DArgs> =
    new ConcentrateGrowLiquidity2DArgsCoder()

  constructor(
    public readonly sqrtPriceMin: bigint,
    public readonly sqrtPriceMax: bigint,
  ) {
    assert(
      sqrtPriceMin > 0n && sqrtPriceMin <= UINT_256_MAX,
      `Invalid sqrtPriceMin: ${sqrtPriceMin}. Must be > 0 and <= UINT_256_MAX`,
    )
    assert(
      sqrtPriceMax > 0n && sqrtPriceMax <= UINT_256_MAX,
      `Invalid sqrtPriceMax: ${sqrtPriceMax}. Must be > 0 and <= UINT_256_MAX`,
    )
    assert(
      sqrtPriceMin < sqrtPriceMax,
      `Invalid bounds: sqrtPriceMin (${sqrtPriceMin}) must be < sqrtPriceMax (${sqrtPriceMax})`,
    )
  }

  /**
   * Build args from sqrt prices (1e18 fixed-point).
   * sqrtPriceMin/Max = sqrt(P) where P = tokenGt/tokenLt.
   **/
  static fromSqrtPrices(
    sqrtPriceMin: bigint,
    sqrtPriceMax: bigint,
  ): ConcentrateGrowLiquidity2DArgs {
    return new ConcentrateGrowLiquidity2DArgs(sqrtPriceMin, sqrtPriceMax)
  }

  /**
   * Build args from raw prices P_min, P_max (1e18 fixed-point).
   * Computes sqrtPrice = sqrt(P * 1e18) so that (sqrtPrice/1e18)^2 = P/1e18.
   **/
  static fromRawPrices(rawPriceMin: bigint, rawPriceMax: bigint): ConcentrateGrowLiquidity2DArgs {
    const sqrtPriceMin = bigintSqrt(rawPriceMin * ONE_E18)
    const sqrtPriceMax = bigintSqrt(rawPriceMax * ONE_E18)

    return new ConcentrateGrowLiquidity2DArgs(sqrtPriceMin, sqrtPriceMax)
  }

  /**
   * Decodes hex data into ConcentrateGrowLiquidity2DArgs instance
   **/
  static decode(data: HexString): ConcentrateGrowLiquidity2DArgs {
    return ConcentrateGrowLiquidity2DArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      sqrtPriceMin: this.sqrtPriceMin.toString(),
      sqrtPriceMax: this.sqrtPriceMax.toString(),
    }
  }
}
