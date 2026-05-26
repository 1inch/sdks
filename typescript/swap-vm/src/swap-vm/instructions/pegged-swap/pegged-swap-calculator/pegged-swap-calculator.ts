// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import type { Address } from '@1inch/sdk-core'
import assert from 'assert'
import type { PeggedInitialBalances, PeggedSwapCalculatorArgs } from './types'
import type { PeggedPrice, PeggedTokenRef } from '../price'

const MARGINAL_PRICE_ONE = 10n ** 18n

export class PeggedSwapCalculator {
  constructor(
    private readonly tokenA: PeggedTokenRef,
    private readonly tokenB: PeggedTokenRef,
  ) {
    assert(!tokenA.address.equal(tokenB.address), 'tokens must be different')
  }

  get tokenLt(): PeggedTokenRef {
    return this.tokenA.address.lt(this.tokenB.address) ? this.tokenA : this.tokenB
  }

  get tokenGt(): PeggedTokenRef {
    return this.tokenA.address.lt(this.tokenB.address) ? this.tokenB : this.tokenA
  }

  static new(args: PeggedSwapCalculatorArgs): PeggedSwapCalculator {
    return new PeggedSwapCalculator(args.tokenA, args.tokenB)
  }

  /**
   * Initial balances before deployment (`currentReserve = initialReserve`, u = v = 1).
   * Given spot price and one raw initial reserve, returns the other.
   */
  computeFixedAllocation(
    spotPrice: PeggedPrice,
    fixedReserveForToken: Address,
    fixedReserve: bigint,
  ): PeggedInitialBalances {
    assert(fixedReserve > 0n, 'fixed reserve must be positive')
    assert(
      spotPrice.matchesTokens(this.tokenLt.address, this.tokenGt.address),
      'spot price must match calculator token pair',
    )

    const marginalE18 = spotPrice.toGtPerLtE18()

    if (fixedReserveForToken.equal(this.tokenLt.address)) {
      return {
        reserveLt: fixedReserve,
        reserveGt: (fixedReserve * marginalE18) / MARGINAL_PRICE_ONE,
      }
    }

    if (fixedReserveForToken.equal(this.tokenGt.address)) {
      return {
        reserveLt: (fixedReserve * MARGINAL_PRICE_ONE) / marginalE18,
        reserveGt: fixedReserve,
      }
    }

    throw new Error('fixedReserveForToken token must be one of the two pair tokens')
  }
}
