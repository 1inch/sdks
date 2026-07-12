// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { UINT_256_MAX } from '@1inch/byte-utils'
import assert from 'assert'
import type {
  PriceAllocationRange,
  PriceBounds,
  PriceRangeJSON,
  SortedReserves,
  TokenReserves,
} from './types'
import type { PriceToken } from '../price'
import { Price } from '../price'
import {
  computeLiquidityAndPrice,
  computeLiquidityFromAmounts,
} from '../concentrate-liquidity-math/concentrate-liquidity-math'
import { TokenReserve } from '../token-reserve'

export class PriceRange {
  private constructor(
    public readonly minPrice: Price,
    public readonly spotPrice: Price,
    public readonly maxPrice: Price,
  ) {
    assert(maxPrice.gte(spotPrice), 'maxPrice should be >= spotPrice')
    assert(spotPrice.gte(minPrice), 'spotPrice should be >= minPrice')
    assert(minPrice.lt(maxPrice), 'minPrice should be < maxPrice')
    assert(minPrice.isSamePair(spotPrice), 'cannot create price range for different pairs')
    assert(maxPrice.isSamePair(spotPrice), 'cannot create price range for different pairs')
  }

  get token0(): PriceToken {
    return this.minPrice.token0
  }

  get token1(): PriceToken {
    return this.minPrice.token1
  }

  static new(range: PriceAllocationRange): PriceRange {
    const minPrice = range.minPrice.lte(range.spotPrice) ? range.minPrice : range.maxPrice
    const maxPrice = range.maxPrice.gte(range.spotPrice) ? range.maxPrice : range.minPrice

    return new PriceRange(minPrice, range.spotPrice, maxPrice)
  }

  static fromJSON(input: PriceRangeJSON): PriceRange {
    return PriceRange.new({
      minPrice: Price.fromJSON(input.minPrice),
      spotPrice: Price.fromJSON(input.spotPrice),
      maxPrice: Price.fromJSON(input.maxPrice),
    })
  }

  static fromPriceBounds(bounds: PriceBounds, reserves: TokenReserves): PriceRange {
    const minPrice = bounds.minPrice.lt(bounds.maxPrice) ? bounds.minPrice : bounds.maxPrice
    const maxPrice = bounds.minPrice.lt(bounds.maxPrice) ? bounds.maxPrice : bounds.minPrice

    const zeroForOne = reserves.reserveA.token.equal(bounds.minPrice.token0.address)
    const reserve0 = zeroForOne ? reserves.reserveA : reserves.reserveB
    const reserve1 = zeroForOne ? reserves.reserveB : reserves.reserveA

    assert(
      reserve0.token.equal(bounds.minPrice.token0.address),
      'provided reserve for unknown token',
    )

    assert(
      reserve1.token.equal(bounds.minPrice.token1.address),
      'provided reserve for unknown token',
    )

    assert(reserve0.reserve > 0n || reserve1.reserve > 0n, 'at least one reserve must be positive')

    // Single-sided composition: the spot sits exactly on a bound (reserve0 depletes at max,
    // reserve1 at min). Deriving it via computeLiquidityAndPrice would reintroduce integer
    // truncation that can land the implied sqrt spot just outside the bounds.
    if (reserve0.reserve === 0n) {
      return PriceRange.new({ minPrice, spotPrice: maxPrice, maxPrice })
    }

    if (reserve1.reserve === 0n) {
      return PriceRange.new({ minPrice, spotPrice: minPrice, maxPrice })
    }

    const { sqrtPriceSpot } = computeLiquidityAndPrice(
      reserve0.reserve,
      reserve1.reserve,
      minPrice.toSqrt(),
      maxPrice.toSqrt(),
    )

    const spotPrice = Price.fromSqrt(sqrtPriceSpot, {
      tokenA: bounds.minPrice.token0,
      tokenB: bounds.minPrice.token1,
    })

    return PriceRange.new({ minPrice, spotPrice, maxPrice })
  }

  computeFixedAllocation(fixedReserve: TokenReserve): SortedReserves {
    assert(
      fixedReserve.token.equal(this.token0.address) ||
        fixedReserve.token.equal(this.token1.address),
      'fixed reserve should be in some pair token',
    )

    const isFixedLt = fixedReserve.token.equal(this.token0.address)

    const availableLt = isFixedLt ? fixedReserve.reserve : UINT_256_MAX
    const availableGt = isFixedLt ? UINT_256_MAX : fixedReserve.reserve

    const { actualLt, actualGt } = computeLiquidityFromAmounts(
      availableLt,
      availableGt,
      this.spotPrice.toSqrt(),
      this.minPrice.toSqrt(),
      this.maxPrice.toSqrt(),
    )

    return {
      reserve0: TokenReserve.new({
        token: this.token0.address,
        reserve: actualLt,
      }),
      reserve1: TokenReserve.new({
        token: this.token1.address,
        reserve: actualGt,
      }),
    }
  }

  computeMaxAllocation(maxAvailableLiquidity: TokenReserves): SortedReserves {
    const zeroForOne = maxAvailableLiquidity.reserveA.token.equal(this.token0.address)
    const reserve0 = zeroForOne ? maxAvailableLiquidity.reserveA : maxAvailableLiquidity.reserveB
    const reserve1 = zeroForOne ? maxAvailableLiquidity.reserveB : maxAvailableLiquidity.reserveA

    assert(reserve0.token.equal(this.token0.address), 'provided reserve for unknown token')

    assert(reserve1.token.equal(this.token1.address), 'provided reserve for unknown token')

    const { actualLt, actualGt } = computeLiquidityFromAmounts(
      reserve0.reserve,
      reserve1.reserve,
      this.spotPrice.toSqrt(),
      this.minPrice.toSqrt(),
      this.maxPrice.toSqrt(),
    )

    return {
      reserve0: TokenReserve.new({
        token: this.token0.address,
        reserve: actualLt,
      }),
      reserve1: TokenReserve.new({
        token: this.token1.address,
        reserve: actualGt,
      }),
    }
  }

  toJSON(): PriceRangeJSON {
    return {
      minPrice: this.minPrice.toJSON(),
      spotPrice: this.spotPrice.toJSON(),
      maxPrice: this.maxPrice.toJSON(),
    }
  }
}
