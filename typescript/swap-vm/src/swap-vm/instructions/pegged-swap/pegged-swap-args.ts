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
 *
 * The slots follow token address order, not swap direction: x0 and rateLt always describe the token
 * with the LOWER address (Lt), y0 and rateGt the token with the HIGHER address (Gt). On-chain,
 * `PeggedSwapArgsBuilder.parseRatesAndBalances` picks them for each swap by comparing
 * `tokenIn < tokenOut`. {@link PeggedSwapArgs.fromTokens} applies this convention for you.
 * @see https://github.com/1inch/swap-vm/blob/main/src/instructions/PeggedSwap.sol
 **/
export class PeggedSwapArgs implements IArgsData {
  public static readonly CODER: IArgsCoder<PeggedSwapArgs> = new PeggedSwapArgsCoder()

  /**
   * Raw constructor: encodes the values exactly as given. It has no token addresses, so it cannot
   * check that x0/rateLt belong to the lower-address token and y0/rateGt to the higher-address one.
   * Swapped values are accepted and silently mis-normalize both swap directions (quotes are computed
   * from the same args, so nothing looks off). Prefer {@link PeggedSwapArgs.fromTokens}.
   *
   * x0 - Initial reserve (normalization factor) of the LOWER-address token: `initialReserveLt * rateLt`
   * y0 - Initial reserve (normalization factor) of the HIGHER-address token: `initialReserveGt * rateGt`
   * linearWidth - Linear component coefficient A scaled by 1e27 (e.g., 0.8e27 for A=0.8); must be ≤ MAX_LINEAR_WIDTH (A ≤ 5000)
   * rateLt - Rate multiplier of the LOWER-address token: `resolveRate(decimalsLt, decimalsGt)`
   * rateGt - Rate multiplier of the HIGHER-address token: `resolveRate(decimalsGt, decimalsLt)`
   * > Rates scale both tokens up to the larger decimals: the token with fewer decimals gets
   * > 10^(decimals difference), the other gets 1 (both 1 for equal decimals)
   * > Example: DAI (0x6B17…, 18 decimals) < USDC (0xA0b8…, 6 decimals), so for 1000 DAI + 1000 USDC:
   * > rateLt = 1, rateGt = 1e12, x0 = 1000e18 * 1, y0 = 1000e6 * 1e12
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

  /**
   * Safe way to build the args: takes both tokens in any order with their raw (unscaled) initial
   * reserves, sorts them by address and derives rateLt/rateGt with {@link resolveRate}.
   **/
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
