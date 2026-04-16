// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import assert from 'assert'
import type { PriceAllocationRange, PriceBounds, PriceRangeJSON, TokenReserves } from './types'
import { Price } from '../price'
import { computeLiquidityAndPrice } from '../concentrate-liquidity-math/concentrate-liquidity-math'

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

  toJSON(): PriceRangeJSON {
    return {
      minPrice: this.minPrice.toJSON(),
      spotPrice: this.spotPrice.toJSON(),
      maxPrice: this.maxPrice.toJSON(),
    }
  }
}
