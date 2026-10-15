// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address } from '@1inch/sdk-core'
import { formatUnits, parseUnits } from 'viem'
import assert from 'assert'
import type {
  PeggedPriceJSON,
  PeggedPriceLegacyJSON,
  PeggedPricePair,
  PeggedReservesInput,
  PeggedTokenRef,
} from './types'
import { peggedSwapMarginalGtPerLt } from '../pegged-swap-math/pegged-swap-math'
import { truncateHumanDecimalString } from '../../utils'
import { resolveRate } from '../rate-resolver'

const ONE_E18 = 10n ** 18n

/**
 * Pegged pair spot price, held exactly as `numerator / denominator` raw tokenGt units per raw
 * tokenLt unit (in lowest terms). Only converted amounts and display strings are rounded.
 */
export class PeggedPrice {
  private readonly numerator: bigint

  private readonly denominator: bigint

  private constructor(
    numerator: bigint,
    denominator: bigint,
    public readonly tokenLt: PeggedTokenRef,
    public readonly tokenGt: PeggedTokenRef,
  ) {
    assert(numerator > 0n && denominator > 0n, 'price must be positive')
    assert(tokenLt.address.lt(tokenGt.address), 'internal pair order violated')

    const divisor = gcd(numerator, denominator)
    this.numerator = numerator / divisor
    this.denominator = denominator / divisor
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

    const { numerator, denominator } = peggedSwapMarginalGtPerLt(
      reserveLt.currentReserve * rateLt,
      reserveGt.currentReserve * rateGt,
      initialLtNorm,
      initialGtNorm,
      input.linearWidth,
      rateLt,
      rateGt,
    )

    return new PeggedPrice(numerator, denominator, reserveLt, reserveGt)
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

    const ltUnit = 10n ** BigInt(tokenLt.decimals)
    const gtUnit = 10n ** BigInt(tokenGt.decimals)

    // Raw gt-per-lt = human gt-per-lt * 10^gtDecimals / 10^ltDecimals.
    // lt quote: parsed = H * 10^ltDecimals with H = human lt-per-gt = 1/humanGtPerLt,
    // so raw = 10^gtDecimals / parsed.
    // gt quote: parsed = human gt-per-lt * 10^gtDecimals, so raw = parsed / 10^ltDecimals.
    return quoteToBase
      ? new PeggedPrice(gtUnit, parsed, tokenLt, tokenGt)
      : new PeggedPrice(parsed, ltUnit, tokenLt, tokenGt)
  }

  /**
   * Restores a price from {@link PeggedPrice.toJSON} output. Also accepts the legacy
   * `{ gtPerLtRaw, tokenLt, tokenGt }` snapshot.
   */
  static fromJSON(input: PeggedPriceJSON | PeggedPriceLegacyJSON): PeggedPrice {
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

    if ('numerator' in input) {
      return new PeggedPrice(BigInt(input.numerator), BigInt(input.denominator), tokenLt, tokenGt)
    }

    const legacyScale = 10n ** BigInt(tokenLt.decimals + tokenGt.decimals)

    return new PeggedPrice(BigInt(input.gtPerLtRaw), legacyScale, tokenLt, tokenGt)
  }

  matchesTokens(tokenA: Address, tokenB: Address): boolean {
    return (
      (tokenA.equal(this.tokenLt.address) && tokenB.equal(this.tokenGt.address)) ||
      (tokenA.equal(this.tokenGt.address) && tokenB.equal(this.tokenLt.address))
    )
  }

  equals(other: PeggedPrice): boolean {
    return (
      this.numerator * other.denominator === other.numerator * this.denominator &&
      this.tokenLt.address.equal(other.tokenLt.address) &&
      this.tokenGt.address.equal(other.tokenGt.address) &&
      BigInt(this.tokenLt.decimals) === BigInt(other.tokenLt.decimals) &&
      BigInt(this.tokenGt.decimals) === BigInt(other.tokenGt.decimals)
    )
  }

  /**
   * Raw tokenGt amount worth `amountLt` raw tokenLt at this price, rounded down.
   */
  gtForLt(amountLt: bigint): bigint {
    assert(amountLt >= 0n, 'amount must be non-negative')

    return (amountLt * this.numerator) / this.denominator
  }

  /**
   * Raw tokenLt amount worth `amountGt` raw tokenGt at this price, rounded down.
   */
  ltForGt(amountGt: bigint): bigint {
    assert(amountGt >= 0n, 'amount must be non-negative')

    return (amountGt * this.denominator) / this.numerator
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

    const quoteDecimals = Number(isQuoteLt ? this.tokenLt.decimals : this.tokenGt.decimals)
    const ltUnit = 10n ** BigInt(this.tokenLt.decimals)
    const gtUnit = 10n ** BigInt(this.tokenGt.decimals)

    // Quote per base at display scale 10^quoteDecimals, from raw = numerator / denominator:
    // lt quote: human lt-per-gt * 10^ltDecimals = 10^gtDecimals / raw;
    // gt quote: human gt-per-lt * 10^gtDecimals = raw * 10^ltDecimals.
    // One extra floored digit is enough to round half-up at quoteDecimals.
    const scaledWithRoundingDigit = isQuoteLt
      ? (gtUnit * this.denominator * 10n) / this.numerator
      : (ltUnit * this.numerator * 10n) / this.denominator

    const full = formatUnits(scaledWithRoundingDigit, quoteDecimals + 1)

    return truncateHumanDecimalString(full, quoteDecimals)
  }

  /**
   * Raw gt-per-lt rate in 1e18 fixed-point, rounded down. Coarse when the raw rate is small
   * (tokenLt has many more decimals than tokenGt); convert amounts with
   * {@link PeggedPrice.gtForLt} / {@link PeggedPrice.ltForGt} instead.
   */
  toGtPerLtE18(): bigint {
    return (this.numerator * ONE_E18) / this.denominator
  }

  toJSON(): PeggedPriceJSON {
    return {
      numerator: this.numerator.toString(),
      denominator: this.denominator.toString(),
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

function gcd(a: bigint, b: bigint): bigint {
  let x = a
  let y = b

  while (y > 0n) {
    const remainder = x % y
    x = y
    y = remainder
  }

  return x
}
