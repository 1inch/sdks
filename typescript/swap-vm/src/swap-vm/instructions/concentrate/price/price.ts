// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { formatUnits, parseUnits } from 'viem'
import assert from 'assert'
import type { PriceTokenRef } from './refs'
import type { PriceFromHumanParams, PriceFromSqrtParams } from './types'
import { bigintSqrt } from '../bigint-sqrt'

const ONE_E18 = 10n ** 18n

/**
 * Token price in concentrated liquidity math, stored as **sqrt(P)** in 1e18 fixed-point
 * (same units as `ConcentratedLiquidityInfo.sqrtPriceSpot`).
 * {@link Price.quoteToken} / {@link Price.baseToken} label the pair (quote per 1 base in human terms).
 */
export class Price {
  private constructor(
    /** sqrt(P · 1e18) in 1e18 fixed-point — matches on-chain / {@link computeLiquidityFromAmounts} inputs. */
    private readonly sqrtP: bigint,
    readonly quoteToken: PriceTokenRef,
    readonly baseToken: PriceTokenRef,
  ) {
    assert(sqrtP >= 0n, 'sqrt price must be non-negative')
    assert(!quoteToken.address.equal(baseToken.address), 'quote and base must be different tokens')
  }

  /**
   * Fixed-point sqrt price as used on-chain (`sqrt(P * 1e18)` in 1e18 fixed-point).
   */
  static fromSqrt(params: PriceFromSqrtParams): Price {
    return new Price(params.sqrtP, params.quoteToken, params.baseToken)
  }

  /**
   * Human decimal string for **quote per 1 base** at scale `10^(token0Decimals + token1Decimals)`.
   */
  static fromHuman(params: PriceFromHumanParams): Price {
    const zeroForOne = params.quoteToken.address.lt(params.baseToken.address)
    const t0 = zeroForOne ? params.quoteToken : params.baseToken
    const t1 = zeroForOne ? params.baseToken : params.quoteToken
    const d0 = t0.decimals
    const d1 = t1.decimals
    const scale = d0 + d1

    if (scale > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('decimals sum too large for parseUnits')
    }

    const scaledRaw = parseUnits(params.price.trim() as `${number}`, Number(scale))

    let internalP: bigint

    if (params.quoteToken.address.equal(t0.address)) {
      const numerator = 10n ** (d1 + d1) * ONE_E18
      internalP = numerator / scaledRaw
    } else if (params.quoteToken.address.equal(t1.address)) {
      const denominator = 10n ** (d0 + d0)
      internalP = (scaledRaw * ONE_E18) / denominator
    } else {
      throw new Error('quote token must be one of the two pair tokens')
    }

    return new Price(bigintSqrt(internalP * ONE_E18), params.quoteToken, params.baseToken)
  }

  /**
   * Internal **P = token1 ÷ token0** (1e18-style): `(sqrtP²) / 1e18`. Reciprocal **token0 ÷ token1** in fixed-point is **`(10^36 / P)`**.
   */
  toInternalRaw(): bigint {
    return (this.sqrtP * this.sqrtP) / ONE_E18
  }

  toSqrtFixed(): bigint {
    return this.sqrtP
  }

  /**
   * Decimal string for **quote per 1 base** at scale `10^(token0Decimals + token1Decimals)`.
   */
  toHuman(): string {
    const zeroForOne = this.quoteToken.address.lt(this.baseToken.address)
    const t0 = zeroForOne ? this.quoteToken : this.baseToken
    const t1 = zeroForOne ? this.baseToken : this.quoteToken
    const scale = t0.decimals + t1.decimals
    const scaled = this.scaledRawAmount()

    return formatUnits(scaled, Number(scale))
  }

  equals(other: Price): boolean {
    return (
      this.sqrtP === other.sqrtP &&
      this.quoteToken.address.equal(other.quoteToken.address) &&
      this.quoteToken.decimals === other.quoteToken.decimals &&
      this.baseToken.address.equal(other.baseToken.address) &&
      this.baseToken.decimals === other.baseToken.decimals
    )
  }

  /**
   * Quote per 1 base scaled by `10^(token0Decimals + token1Decimals)` (matches {@link fromHuman} / {@link toHuman}).
   */
  private scaledRawAmount(): bigint {
    const zeroForOne = this.quoteToken.address.lt(this.baseToken.address)
    const t0 = zeroForOne ? this.quoteToken : this.baseToken
    const t1 = zeroForOne ? this.baseToken : this.quoteToken
    const d0 = t0.decimals
    const d1 = t1.decimals
    const p = this.toInternalRaw()

    if (this.quoteToken.address.equal(t0.address)) {
      const numerator = 10n ** (d1 + d1) * ONE_E18

      return numerator / p
    }

    if (this.quoteToken.address.equal(t1.address)) {
      const denominator = 10n ** (d0 + d0)

      return (p * denominator) / ONE_E18
    }

    throw new Error('invariant: quote token must be one of the pair tokens')
  }
}
