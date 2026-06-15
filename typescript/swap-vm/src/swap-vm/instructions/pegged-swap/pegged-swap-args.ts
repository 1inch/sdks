// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { HexString } from '@1inch/sdk-core'
import { UINT_256_MAX } from '@1inch/byte-utils'
import assert from 'assert'
import { PeggedSwapArgsCoder } from './pegged-swap-args-coder'
import { MAX_LINEAR_WIDTH } from './pegged-swap-math/pegged-swap-math'
import type { PeggedTokenInfo } from './types'
import { resolveRate } from './rate-resolver'
import type { IArgsCoder, IArgsData } from '../types'

/**
 * Arguments for PeggedSwap._peggedSwapGrowPriceRange2D.
 * 5 × uint256: x0, y0, linearWidth, rateLt, rateGt (160 bytes).
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/PeggedSwap.sol
 **/
export class PeggedSwapArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<PeggedSwapArgs> = new PeggedSwapArgsCoder()

  /**
   * x0 - Initial X reserve (normalization factor) = initial_balance_X * rateLt (or rateGt)
   * y0 - Initial Y reserve (normalization factor) = initial_balance_Y * rateGt (or rateLt)
   * linearWidth - Linear component coefficient A scaled by 1e27 (e.g., 0.8e27 for A=0.8); must be ≤ MAX_LINEAR_WIDTH (A ≤ 5000)
   * rateLt - Rate multiplier for token with LOWER address
   * rateGt - Rate multiplier for token with GREATER address
   * > For equal decimals (e.g., both 18): rateLt = rateGt = 1
   * > For 18 vs 6 decimals: rate18 = 1, rate6 = 1e12 (to scale up to common precision)
   **/
  constructor(
    public readonly x0: bigint,
    public readonly y0: bigint,
    public readonly linearWidth: bigint,
    public readonly rateLt: bigint,
    public readonly rateGt: bigint,
  ) {
    assert(x0 > 0n && y0 > 0n, 'Reserves cannot be zero')
    assert(x0 <= UINT_256_MAX, `Invalid x0: ${x0}`)
    assert(y0 <= UINT_256_MAX, `Invalid y0: ${y0}`)
    assert(linearWidth <= MAX_LINEAR_WIDTH, `Invalid linearWidth: ${linearWidth}`)
    assert(
      rateLt > 0n && rateLt <= UINT_256_MAX,
      `Invalid rateLt: ${rateLt}. Must be positive and <= UINT_256_MAX`,
    )
    assert(
      rateGt > 0n && rateGt <= UINT_256_MAX,
      `Invalid rateGt: ${rateGt}. Must be positive and <= UINT_256_MAX`,
    )
  }

  static fromTokens(
    tokenA: PeggedTokenInfo,
    tokenB: PeggedTokenInfo,
    linearWidth: bigint,
  ): PeggedSwapArgs {
    const tokenARate = resolveRate(tokenA.decimals, tokenB.decimals)
    const tokenBRate = resolveRate(tokenB.decimals, tokenA.decimals)

    if (BigInt(tokenA.address.toString()) < BigInt(tokenB.address.toString())) {
      return new PeggedSwapArgs(
        tokenA.reserve * tokenARate,
        tokenB.reserve * tokenBRate,
        linearWidth,
        tokenARate,
        tokenBRate,
      )
    }

    return new PeggedSwapArgs(
      tokenB.reserve * tokenBRate,
      tokenA.reserve * tokenARate,
      linearWidth,
      tokenBRate,
      tokenARate,
    )
  }

  static decode(data: HexString): PeggedSwapArgs {
    return PeggedSwapArgs.CODER.decode(data)
  }

  toJSON(): Record<string, unknown> {
    return {
      x0: this.x0.toString(),
      y0: this.y0.toString(),
      linearWidth: this.linearWidth.toString(),
      rateLt: this.rateLt.toString(),
      rateGt: this.rateGt.toString(),
    }
  }
}
