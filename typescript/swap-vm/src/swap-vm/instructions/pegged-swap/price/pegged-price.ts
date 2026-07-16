// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address } from '@1inch/sdk-core'
import { formatUnits, parseUnits } from 'viem'
import assert from 'assert'
import type { PeggedPriceJSON, PeggedPricePair, PeggedReservesInput, PeggedTokenRef } from './types'
import { peggedSwapMarginalGtPerLtE18 } from '../pegged-swap-math/pegged-swap-math'
import { truncateHumanDecimalString } from '../../utils'
import { resolveRate } from '../rate-resolver'

const ONE_E18 = 10n ** 18n

export class PeggedPrice {
  private constructor(
    private readonly gtPerLtRaw: bigint,
    public readonly tokenLt: PeggedTokenRef,
    public readonly tokenGt: PeggedTokenRef,
  ) {
    assert(gtPerLtRaw > 0n, 'price must be positive')
    assert(tokenLt.address.lt(tokenGt.address), 'internal pair order violated')
  }

  /**
   * Spot price from per-token `initialReserve` / `currentReserve` (raw, not rate-scaled) and `linearWidth`.
   * Use currentReserve = initialReserve to calculate the spot price before the strategy was deployed
   */
  static fromReserves(input: PeggedReservesInput): PeggedPrice {
    assert(
      input.reserveA.currentReserve > 0n && input.reserveB.currentReserve > 0n,
      'current reserves should be positive',
    )

    assert(
      input.reserveA.initialReserve > 0n && input.reserveB.initialReserve > 0n,
      'initial reserves should be positive',
    )

    const zeroForOne = input.reserveA.address.lt(input.reserveB.address)
    const reserveLt = zeroForOne ? input.reserveA : input.reserveB
    const reserveGt = zeroForOne ? input.reserveB : input.reserveA

    const rateLt = resolveRate(reserveLt.decimals, reserveGt.decimals)
    const rateGt = resolveRate(reserveGt.decimals, reserveLt.decimals)

    const initialLtNorm = reserveLt.initialReserve * rateLt
    const initialGtNorm = reserveGt.initialReserve * rateGt

    const marginalE18 = peggedSwapMarginalGtPerLtE18(
      reserveLt.currentReserve * rateLt,
      reserveGt.currentReserve * rateGt,
      initialLtNorm,
      initialGtNorm,
      input.linearWidth,
      rateLt,
      rateGt,
    )

    return PeggedPrice.fromGtPerLtE18(marginalE18, reserveLt, reserveGt)
  }

  /**
   * Human decimal string for **quote per 1 base**.
   */
  static fromHuman(price: string, pair: PeggedPricePair): PeggedPrice {
    assert(
      !pair.quoteToken.address.equal(pair.baseToken.address),
      'quote and base must be different tokens',
    )

    const quoteToBase = pair.quoteToken.address.lt(pair.baseToken.address)

    const tokenLt = quoteToBase ? pair.quoteToken : pair.baseToken
    const tokenGt = quoteToBase ? pair.baseToken : pair.quoteToken

    const parsed = parseUnits(price.trim(), Number(pair.quoteToken.decimals))

    const ltDecimals = BigInt(tokenLt.decimals)
    const gtDecimals = BigInt(tokenGt.decimals)

    // Canonical rate is RAW gt-per-lt in 1e18 fixed-point:
    // raw = human gt-per-lt * 10^(gtDecimals - ltDecimals) * 1e18.
    // lt quote: parsed = H * 10^ltDecimals with H = human lt-per-gt = 1/humanGtPerLt,
    // so raw = 10^(18 + gtDecimals) / parsed.
    const marginalE18 = quoteToBase
      ? 10n ** (18n + gtDecimals) / parsed
      : (parsed * ONE_E18) / 10n ** ltDecimals

    return PeggedPrice.fromGtPerLtE18(marginalE18, tokenLt, tokenGt)
  }

  static fromJSON(input: PeggedPriceJSON): PeggedPrice {
    const tokenLt: PeggedTokenRef = {
      address: new Address(input.tokenLt.address),
      decimals: Number(input.tokenLt.decimals),
    }
    const tokenGt: PeggedTokenRef = {
      address: new Address(input.tokenGt.address),
      decimals: Number(input.tokenGt.decimals),
    }
    assert(
      tokenLt.address.lt(tokenGt.address),
      'tokenLt address must be less than tokenGt (canonical order)',
    )

    return new PeggedPrice(BigInt(input.gtPerLtRaw), tokenLt, tokenGt)
  }

  private static fromGtPerLtE18(
    marginalGtPerLtE18: bigint,
    tokenLt: PeggedTokenRef,
    tokenGt: PeggedTokenRef,
  ): PeggedPrice {
    assert(marginalGtPerLtE18 > 0n, 'marginal rate must be positive')

    const scale = BigInt(tokenLt.decimals + tokenGt.decimals)
    const gtPerLtRaw = (marginalGtPerLtE18 * 10n ** scale) / ONE_E18

    return new PeggedPrice(gtPerLtRaw, tokenLt, tokenGt)
  }

  matchesTokens(tokenA: Address, tokenB: Address): boolean {
    return (
      (tokenA.equal(this.tokenLt.address) && tokenB.equal(this.tokenGt.address)) ||
      (tokenA.equal(this.tokenGt.address) && tokenB.equal(this.tokenLt.address))
    )
  }

  equals(other: PeggedPrice): boolean {
    return (
      this.gtPerLtRaw === other.gtPerLtRaw &&
      this.tokenLt.address.equal(other.tokenLt.address) &&
      this.tokenGt.address.equal(other.tokenGt.address) &&
      BigInt(this.tokenLt.decimals) === BigInt(other.tokenLt.decimals) &&
      BigInt(this.tokenGt.decimals) === BigInt(other.tokenGt.decimals)
    )
  }

  /**
   * Decimal string for **quote per 1 base**; rounded half-up to quote token decimals.
   */
  toHuman(quoteToken: Address): string {
    assert(
      quoteToken.equal(this.tokenLt.address) || quoteToken.equal(this.tokenGt.address),
      'quote token must be one of the pair tokens',
    )

    const isQuoteLt = quoteToken.equal(this.tokenLt.address)

    const quoteDecimals = isQuoteLt ? this.tokenLt.decimals : this.tokenGt.decimals
    const ltDecimals = BigInt(this.tokenLt.decimals)
    const gtDecimals = BigInt(this.tokenGt.decimals)
    const marginalE18 = this.toGtPerLtE18()

    // marginalE18 is the RAW gt-per-lt rate in 1e18 fixed-point.
    // lt quote: human lt-per-gt = 1e18 * 10^(gtDecimals - ltDecimals) / marginalE18;
    // at display scale 10^ltDecimals that is 10^(18 + gtDecimals) / marginalE18.
    const scaled = quoteToken.equal(this.tokenGt.address)
      ? (marginalE18 * 10n ** ltDecimals) / ONE_E18
      : 10n ** (18n + gtDecimals) / marginalE18

    const full = formatUnits(scaled, Number(quoteDecimals))

    return truncateHumanDecimalString(full, Number(quoteDecimals))
  }

  /** Marginal gt-per-lt rate in 1e18 fixed-point. */
  toGtPerLtE18(): bigint {
    const scale = BigInt(this.tokenLt.decimals + this.tokenGt.decimals)

    return (this.gtPerLtRaw * ONE_E18) / 10n ** scale
  }

  toJSON(): PeggedPriceJSON {
    return {
      gtPerLtRaw: this.gtPerLtRaw.toString(),
      tokenLt: {
        address: this.tokenLt.address.toString(),
        decimals: String(this.tokenLt.decimals),
      },
      tokenGt: {
        address: this.tokenGt.address.toString(),
        decimals: String(this.tokenGt.decimals),
      },
    }
  }
}
