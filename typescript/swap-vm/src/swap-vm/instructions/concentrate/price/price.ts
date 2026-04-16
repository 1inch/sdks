// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { Address } from '@1inch/sdk-core'
import { formatUnits, parseUnits } from 'viem'
import assert from 'assert'
import type { PriceJSON, PricePair, PriceToken } from './types'
import { truncateHumanDecimalString } from './truncate-human-decimal-string'
import { bigintSqrt } from '../bigint-sqrt'

const ONE_E18 = 10n ** 18n

export class Price {
  private constructor(
    private readonly sqrtP: bigint,
    public readonly token0: PriceToken,
    public readonly token1: PriceToken,
  ) {
    assert(sqrtP > 0n, 'sqrt price must be positive')
    assert(!token0.address.equal(token1.address), 'price tokens should be different')
  }

  /**
   * Fixed-point sqrt price as used on-chain (`sqrt(P * 1e18)`).
   */
  static fromSqrt(price: bigint, pair: { tokenA: PriceToken; tokenB: PriceToken }): Price {
    const zeroForOne = pair.tokenA.address.lt(pair.tokenB.address)
    const token0 = zeroForOne ? pair.tokenA : pair.tokenB
    const token1 = zeroForOne ? pair.tokenB : pair.tokenA

    return new Price(price, token0, token1)
  }

  /**
   * Human decimal string for **quote per 1 base**`.
   */
  static fromHuman(price: string, pair: PricePair): Price {
    assert(
      !pair.quoteToken.address.equal(pair.baseToken.address),
      'quote and base must be different tokens',
    )

    const zeroForOne = pair.quoteToken.address.lt(pair.baseToken.address)
    const t0 = zeroForOne ? pair.quoteToken : pair.baseToken
    const t1 = zeroForOne ? pair.baseToken : pair.quoteToken
    const d0 = t0.decimals
    const d1 = t1.decimals
    const scale = d0 + d1

    if (scale > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error('decimals sum too large for parseUnits')
    }

    const scaledRaw = parseUnits(price.trim() as `${number}`, Number(scale))

    if (pair.quoteToken.address.equal(t0.address)) {
      const numerator = 10n ** (d1 + d1) * ONE_E18

      return new Price(bigintSqrt((numerator * ONE_E18) / scaledRaw), t0, t1)
    }

    if (pair.quoteToken.address.equal(t1.address)) {
      const denominator = 10n ** (d0 + d0)

      return new Price(bigintSqrt((scaledRaw * ONE_E18 * ONE_E18) / denominator), t0, t1)
    }

    throw new Error('quote token must be one of the two pair tokens')
  }

  static fromJSON(input: PriceJSON): Price {
    const token0: PriceToken = {
      address: new Address(input.token0.address),
      decimals: BigInt(input.token0.decimals),
    }
    const token1: PriceToken = {
      address: new Address(input.token1.address),
      decimals: BigInt(input.token1.decimals),
    }
    assert(token0.address.lt(token1.address), 'token0 address must be less than token1 (canonical order)')

    return new Price(BigInt(input.sqrtP), token0, token1)
  }

  equals(other: Price): boolean {
    return (
      this.sqrtP === other.sqrtP &&
      this.token0.address.equal(other.token0.address) &&
      this.token1.address.equal(other.token1.address) &&
      this.token0.decimals === other.token0.decimals &&
      this.token1.decimals === other.token1.decimals
    )
  }

  lt(other: Price): boolean {
    assert(this.isSamePair(other), 'cannot compare prices for different pairs')

    return this.sqrtP < other.sqrtP
  }

  lte(other: Price): boolean {
    assert(this.isSamePair(other), 'cannot compare prices for different pairs')

    return this.sqrtP <= other.sqrtP
  }

  gt(other: Price): boolean {
    assert(this.isSamePair(other), 'cannot compare prices for different pairs')

    return this.sqrtP > other.sqrtP
  }

  gte(other: Price): boolean {
    assert(this.isSamePair(other), 'cannot compare prices for different pairs')

    return this.sqrtP >= other.sqrtP
  }

  isSamePair(other: Price): boolean {
    return (
      this.token0.address.equal(other.token0.address) &&
      this.token1.address.equal(other.token1.address) &&
      this.token0.decimals === other.token0.decimals &&
      this.token1.decimals === other.token1.decimals
    )
  }

  /**
   * Raw price `P` with 1e18 fixed-point (`(sqrtP^2) / 1e18`), matching typical on-chain use.
   */
  toRaw(): bigint {
    return (this.sqrtP * this.sqrtP) / ONE_E18
  }

  toSqrt(): bigint {
    return this.sqrtP
  }

  /**
   * Decimal string for **quote per 1 base** at scale `10^(token0Decimals + token1Decimals)`.
   * Fractional digits after the dot are **rounded half-up** to {@link PriceToken.decimals} of
   * the quote token (then trailing zeros are removed).
   *
   * @param quoteToken Which token is the quote currency; base is the other token.
   */
  toHuman(quoteToken: Address): string {
    assert(
      quoteToken.equal(this.token0.address) || quoteToken.equal(this.token1.address),
      'quote token should be one of pair price tokens',
    )

    const d0 = this.token0.decimals
    const d1 = this.token1.decimals
    const scale = d0 + d1
    const scaled = this.scaledRawAmountForQuote(quoteToken)

    const quoteDecimals = quoteToken.equal(this.token0.address) ? d0 : d1

    const full = formatUnits(scaled, Number(scale))

    return truncateHumanDecimalString(full, Number(quoteDecimals))
  }

  toJSON(): PriceJSON {
    return {
      sqrtP: this.sqrtP.toString(),
      token0: {
        address: this.token0.address.toString(),
        decimals: this.token0.decimals.toString(),
      },
      token1: {
        address: this.token1.address.toString(),
        decimals: this.token1.decimals.toString(),
      },
    }
  }

  /**
   * Quote per 1 base scaled by `10^(token0Decimals + token1Decimals)`.
   * Uses `sqrtP^2` in one step so we do not compound truncation from {@link toRaw}.
   */
  private scaledRawAmountForQuote(quoteToken: Address): bigint {
    const d0 = this.token0.decimals
    const d1 = this.token1.decimals
    const sqrtP2 = this.sqrtP * this.sqrtP

    if (quoteToken.equal(this.token0.address)) {
      const numerator = 10n ** (d1 + d1) * ONE_E18

      return (numerator * ONE_E18) / sqrtP2
    }

    if (quoteToken.equal(this.token1.address)) {
      const numerator = 10n ** (d0 + d0)

      return (sqrtP2 * numerator) / (ONE_E18 * ONE_E18)
    }

    throw new Error('quote token must be one of the pair tokens')
  }
}
