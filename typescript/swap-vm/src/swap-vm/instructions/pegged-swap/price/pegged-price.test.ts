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
  decimals: 18n,
  initialReserve: 1000n * 10n ** 18n,
  currentReserve: 1000n * 10n ** 18n,
}

const reserveB: PeggedTokenReserve = {
  address: TOKEN_B,
  decimals: 18n,
  initialReserve: 999n * 10n ** 18n - 1n,
  currentReserve: 999n * 10n ** 18n - 1n,
}

const pairGtQuoteLtBase: PeggedPricePair = {
  quoteToken: { address: TOKEN_B, decimals: 18n },
  baseToken: { address: TOKEN_A, decimals: 18n },
}

const pairLtQuoteGtBase: PeggedPricePair = {
  quoteToken: { address: TOKEN_A, decimals: 18n },
  baseToken: { address: TOKEN_B, decimals: 18n },
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
      quoteToken: { address: TOKEN_B, decimals: 18n },
      baseToken: { address: TOKEN_A, decimals: 6n },
    }

    const pairLtQuoteGtBase: PeggedPricePair = {
      quoteToken: { address: TOKEN_A, decimals: 6n },
      baseToken: { address: TOKEN_B, decimals: 18n },
    }

    const reserveLt = {
      address: TOKEN_A,
      decimals: 6n,
      initialReserve: 1000n * 10n ** 6n,
      currentReserve: 1000n * 10n ** 6n,
    }

    const reserveGt = {
      address: TOKEN_B,
      decimals: 18n,
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
      quoteToken: { address: TOKEN_B, decimals: 6n },
      baseToken: { address: TOKEN_A, decimals: 18n },
    }

    const pairLtQuoteGtBase: PeggedPricePair = {
      quoteToken: { address: TOKEN_A, decimals: 18n },
      baseToken: { address: TOKEN_B, decimals: 6n },
    }

    const reserveLt = {
      address: TOKEN_A,
      decimals: 18n,
      initialReserve: 1000n * 10n ** 18n,
      currentReserve: 1000n * 10n ** 18n,
    }

    const reserveGt = {
      address: TOKEN_B,
      decimals: 6n,
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

  describe('off-center reserves (current ≠ initial)', () => {
    it('equal 18/18 decimals', () => {
      const initial = 10n ** 18n
      const reserveAOff = {
        address: TOKEN_A,
        decimals: 18n,
        initialReserve: initial,
        currentReserve: 993_000_000_000_000_000n,
      }
      const reserveBOff = {
        address: TOKEN_B,
        decimals: 18n,
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
        decimals: 6n,
        initialReserve: 1_000_000n,
        currentReserve: 993_000n,
      }
      const reserveBOff = {
        address: TOKEN_B,
        decimals: 18n,
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
        decimals: 18n,
        initialReserve: 10n ** 18n,
        currentReserve: 993_000_000_000_000_000n,
      }
      const reserveBOff = {
        address: TOKEN_B,
        decimals: 6n,
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
