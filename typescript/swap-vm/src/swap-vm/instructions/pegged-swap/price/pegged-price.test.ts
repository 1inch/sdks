// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { PeggedPrice } from './pegged-price'
import type { PeggedPricePair, PeggedTokenReserve } from './types'

const TOKEN_A = new Address('0x0000000000000000000000000000000000000001')
const TOKEN_B = new Address('0x0000000000000000000000000000000000000002')
const LINEAR_WIDTH = 8n * 10n ** 26n

const reserveA: PeggedTokenReserve = {
  address: TOKEN_A,
  decimals: 18,
  initialReserve: 1000n * 10n ** 18n,
  currentReserve: 1000n * 10n ** 18n,
}

const reserveB: PeggedTokenReserve = {
  address: TOKEN_B,
  decimals: 18,
  initialReserve: 999n * 10n ** 18n - 1n,
  currentReserve: 999n * 10n ** 18n - 1n,
}

const pairGtQuoteLtBase: PeggedPricePair = {
  quoteToken: { address: TOKEN_B, decimals: 18 },
  baseToken: { address: TOKEN_A, decimals: 18 },
}

const pairLtQuoteGtBase: PeggedPricePair = {
  quoteToken: { address: TOKEN_A, decimals: 18 },
  baseToken: { address: TOKEN_B, decimals: 18 },
}

describe('PeggedPrice', () => {
  it('fromReserves derives lt/gt from addresses', () => {
    const price = PeggedPrice.fromReserves({
      linearWidth: LINEAR_WIDTH,
      reserveA,
      reserveB,
    })
    expect(price.toHuman(TOKEN_B)).toBe('0.998999999999999999')
  })

  it('fromReserves accepts tokens in either order', () => {
    const forward = PeggedPrice.fromReserves({
      linearWidth: LINEAR_WIDTH,
      reserveA,
      reserveB,
    })
    const reversed = PeggedPrice.fromReserves({
      linearWidth: LINEAR_WIDTH,
      reserveA: reserveB,
      reserveB: reserveA,
    })
    expect(reversed.equals(forward)).toBe(true)
  })

  it('toJSON should yield bigint-safe JSON', () => {
    const price = PeggedPrice.fromHuman('1.5', pairGtQuoteLtBase)
    const json = price.toJSON()

    expect(json.gtPerLtRaw).toBe('1500000000000000000000000000000000000')
    expect(json.tokenLt.decimals).toBe('18')
    expect(json.tokenGt.decimals).toBe('18')
    expect(JSON.stringify(price)).toBe(JSON.stringify(json))
  })

  it('fromJSON should round-trip toJSON', () => {
    const price = PeggedPrice.fromHuman('1.5', pairGtQuoteLtBase)

    expect(PeggedPrice.fromJSON(price.toJSON()).equals(price)).toBe(true)
  })

  it('fromJSON should require canonical tokenLt < tokenGt order', () => {
    const price = PeggedPrice.fromHuman('1.5', pairGtQuoteLtBase)
    const json = price.toJSON()
    const bad = {
      ...json,
      tokenLt: json.tokenGt,
      tokenGt: json.tokenLt,
    }

    expect(() => PeggedPrice.fromJSON(bad)).toThrow('tokenLt address must be less than tokenGt')
  })

  it('fromHuman round-trips gt quote', () => {
    const price = PeggedPrice.fromHuman('1.5', pairGtQuoteLtBase)
    expect(price.toHuman(TOKEN_B)).toBe('1.5')
  })

  it('fromHuman round-trips lt quote', () => {
    const price = PeggedPrice.fromHuman('0.5', pairLtQuoteGtBase)
    expect(price.toHuman(TOKEN_A)).toBe('0.5')
  })

  describe('mixed decimals (lt 6, gt 18)', () => {
    const pairGtQuoteLtBase: PeggedPricePair = {
      quoteToken: { address: TOKEN_B, decimals: 18 },
      baseToken: { address: TOKEN_A, decimals: 6 },
    }

    const pairLtQuoteGtBase: PeggedPricePair = {
      quoteToken: { address: TOKEN_A, decimals: 6 },
      baseToken: { address: TOKEN_B, decimals: 18 },
    }

    const reserveLt = {
      address: TOKEN_A,
      decimals: 6,
      initialReserve: 1000n * 10n ** 6n,
      currentReserve: 1000n * 10n ** 6n,
    }

    const reserveGt = {
      address: TOKEN_B,
      decimals: 18,
      initialReserve: 999n * 10n ** 18n - 1n,
      currentReserve: 999n * 10n ** 18n - 1n,
    }

    it('fromReserves at center is 2 gt per 1 lt', () => {
      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: reserveLt,
        reserveB: reserveGt,
      })
      expect(price.toHuman(TOKEN_B)).toBe('0.998999999999999999')
    })

    it('fromHuman round-trips gt quote', () => {
      const price = PeggedPrice.fromHuman('2', pairGtQuoteLtBase)
      expect(price.toHuman(TOKEN_B)).toBe('2')
    })

    it('fromHuman round-trips lt quote', () => {
      const price = PeggedPrice.fromHuman('0.5', pairLtQuoteGtBase)
      expect(price.toHuman(TOKEN_A)).toBe('0.5')
    })
  })

  describe('mixed decimals (lt 18, gt 6)', () => {
    const pairGtQuoteLtBase: PeggedPricePair = {
      quoteToken: { address: TOKEN_B, decimals: 6 },
      baseToken: { address: TOKEN_A, decimals: 18 },
    }

    const pairLtQuoteGtBase: PeggedPricePair = {
      quoteToken: { address: TOKEN_A, decimals: 18 },
      baseToken: { address: TOKEN_B, decimals: 6 },
    }

    const reserveLt = {
      address: TOKEN_A,
      decimals: 18,
      initialReserve: 1000n * 10n ** 18n,
      currentReserve: 1000n * 10n ** 18n,
    }

    const reserveGt = {
      address: TOKEN_B,
      decimals: 6,
      initialReserve: 999n * 10n ** 6n - 1n,
      currentReserve: 999n * 10n ** 6n - 1n,
    }

    it('fromReserves at center is 2 gt per 1 lt', () => {
      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: reserveLt,
        reserveB: reserveGt,
      })
      expect(price.toHuman(TOKEN_B)).toBe('0.998999')
    })

    it('fromHuman round-trips gt quote', () => {
      const price = PeggedPrice.fromHuman('2', pairGtQuoteLtBase)
      expect(price.toHuman(TOKEN_B)).toBe('2')
    })

    it('fromHuman round-trips lt quote', () => {
      const price = PeggedPrice.fromHuman('0.5', pairLtQuoteGtBase)
      expect(price.toHuman(TOKEN_A)).toBe('0.5')
    })
  })

  describe('lt-quote with mixed decimals (regression for raw vs human marginal mixup)', () => {
    // Equal-value reserves at the deployment center: the true price is exactly 1
    // in BOTH quote directions. Before the fix, quoting in the lower-address
    // token was off by 10^|gtDecimals - ltDecimals| (returned '0' here).
    it('fromReserves quotes 1 in both directions (lt 6 / gt 18)', () => {
      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: {
          address: TOKEN_A,
          decimals: 6,
          initialReserve: 2000n * 10n ** 6n,
          currentReserve: 2000n * 10n ** 6n,
        },
        reserveB: {
          address: TOKEN_B,
          decimals: 18,
          initialReserve: 2000n * 10n ** 18n,
          currentReserve: 2000n * 10n ** 18n,
        },
      })
      expect(price.toHuman(TOKEN_B)).toBe('1')
      expect(price.toHuman(TOKEN_A)).toBe('1')
    })

    it('fromReserves quotes 1 in both directions (lt 18 / gt 6)', () => {
      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: {
          address: TOKEN_A,
          decimals: 18,
          initialReserve: 2000n * 10n ** 18n,
          currentReserve: 2000n * 10n ** 18n,
        },
        reserveB: {
          address: TOKEN_B,
          decimals: 6,
          initialReserve: 2000n * 10n ** 6n,
          currentReserve: 2000n * 10n ** 6n,
        },
      })
      expect(price.toHuman(TOKEN_B)).toBe('1')
      expect(price.toHuman(TOKEN_A)).toBe('1')
    })

    it('fromHuman lt quote read as gt quote is the exact inverse', () => {
      const price = PeggedPrice.fromHuman('2000', {
        quoteToken: { address: TOKEN_A, decimals: 6 },
        baseToken: { address: TOKEN_B, decimals: 18 },
      })
      expect(price.toHuman(TOKEN_A)).toBe('2000')
      expect(price.toHuman(TOKEN_B)).toBe('0.0005')
    })

    it('fromHuman gt quote read as lt quote is the exact inverse', () => {
      const price = PeggedPrice.fromHuman('0.0005', {
        quoteToken: { address: TOKEN_B, decimals: 18 },
        baseToken: { address: TOKEN_A, decimals: 6 },
      })
      expect(price.toHuman(TOKEN_B)).toBe('0.0005')
      expect(price.toHuman(TOKEN_A)).toBe('2000')
    })

    it('equal decimals unchanged: both quote directions from reserves', () => {
      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: {
          address: TOKEN_A,
          decimals: 18,
          initialReserve: 2000n * 10n ** 18n,
          currentReserve: 2000n * 10n ** 18n,
        },
        reserveB: {
          address: TOKEN_B,
          decimals: 18,
          initialReserve: 2000n * 10n ** 18n,
          currentReserve: 2000n * 10n ** 18n,
        },
      })
      expect(price.toHuman(TOKEN_B)).toBe('1')
      expect(price.toHuman(TOKEN_A)).toBe('1')
    })
  })

  describe('off-center reserves (current ≠ initial)', () => {
    it('equal 18/18 decimals', () => {
      const initial = 10n ** 18n
      const reserveAOff = {
        address: TOKEN_A,
        decimals: 18,
        initialReserve: initial,
        currentReserve: 993_000_000_000_000_000n,
      }
      const reserveBOff = {
        address: TOKEN_B,
        decimals: 18,
        initialReserve: initial,
        currentReserve: 999_360_128_962_949_073n,
      }

      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: reserveAOff,
        reserveB: reserveBOff,
      })
      expect(price.toHuman(TOKEN_B)).toBe('1.001229999999999999')
    })

    it('lt 6 / gt 18 decimals', () => {
      const reserveAOff = {
        address: TOKEN_A,
        decimals: 6,
        initialReserve: 1_000_000n,
        currentReserve: 993_000n,
      }
      const reserveBOff = {
        address: TOKEN_B,
        decimals: 18,
        initialReserve: 10n ** 18n,
        currentReserve: 999_360_128_962_949_073n,
      }

      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: reserveAOff,
        reserveB: reserveBOff,
      })
      expect(price.toHuman(TOKEN_B)).toBe('1.001229999999999999')
    })

    it('lt 18 / gt 6 decimals', () => {
      const reserveAOff = {
        address: TOKEN_A,
        decimals: 18,
        initialReserve: 10n ** 18n,
        currentReserve: 993_000_000_000_000_000n,
      }
      const reserveBOff = {
        address: TOKEN_B,
        decimals: 6,
        initialReserve: 1_000_000n,
        currentReserve: 999_360n,
      }

      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: reserveAOff,
        reserveB: reserveBOff,
      })
      expect(price.toHuman(TOKEN_B)).toBe('1.001229')
    })

    it('fromHuman round-trips gt quote (18/18)', () => {
      const price = PeggedPrice.fromHuman('1.00123', pairGtQuoteLtBase)
      expect(price.toHuman(TOKEN_B)).toBe('1.00123')
    })
  })
})
