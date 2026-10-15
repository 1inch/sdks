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

/** Price of `numerator / denominator` raw TOKEN_B (gt) units per raw TOKEN_A (lt) unit. */
function fromFraction(
  numerator: string,
  denominator: string,
  ltDecimals = 18,
  gtDecimals = 18,
): PeggedPrice {
  return PeggedPrice.fromJSON({
    numerator,
    denominator,
    tokenLt: { address: TOKEN_A.toString(), decimals: String(ltDecimals) },
    tokenGt: { address: TOKEN_B.toString(), decimals: String(gtDecimals) },
  })
}

describe('PeggedPrice', () => {
  it('fromReserves derives lt/gt from addresses', () => {
    const price = PeggedPrice.fromReserves({
      linearWidth: LINEAR_WIDTH,
      reserveA,
      reserveB,
    })
    expect(price.toHuman(TOKEN_B)).toBe('0.999')
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

    expect(json.numerator).toBe('3')
    expect(json.denominator).toBe('2')
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
      expect(price.toHuman(TOKEN_B)).toBe('0.999')
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
      expect(price.toHuman(TOKEN_B)).toBe('0.999')
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
      expect(price.toHuman(TOKEN_B)).toBe('1.00123')
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
      expect(price.toHuman(TOKEN_B)).toBe('1.00123')
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
      expect(price.toHuman(TOKEN_B)).toBe('1.00123')
    })

    it('fromHuman round-trips gt quote (18/18)', () => {
      const price = PeggedPrice.fromHuman('1.00123', pairGtQuoteLtBase)
      expect(price.toHuman(TOKEN_B)).toBe('1.00123')
    })
  })

  describe('lt with many more decimals than gt (PDAI 18 / PEURS 2)', () => {
    const PDAI = {
      address: new Address('0x1000000000000000000000000000000000000001'),
      decimals: 18,
    }
    const PEURS = {
      address: new Address('0x2000000000000000000000000000000000000002'),
      decimals: 2,
    }
    const price = PeggedPrice.fromHuman('0.9951', { quoteToken: PDAI, baseToken: PEURS })

    it('keeps the configured price as an exact fraction', () => {
      expect(price.toJSON()).toMatchObject({ numerator: '1', denominator: '9951000000000000' })
      expect(price.toHuman(PDAI.address)).toBe('0.9951')
      expect(price.toHuman(PEURS.address)).toBe('1')
    })

    it('converts amounts at the exact price', () => {
      expect(price.gtForLt(100_000n * 10n ** 18n)).toBe(10_049_241n)
      expect(price.ltForGt(10_049_241n)).toBe(99_999_997_191n * 10n ** 12n)
    })

    it('toGtPerLtE18 rounds the small raw rate down', () => {
      expect(price.toGtPerLtE18()).toBe(100n)
    })
  })

  describe('toHuman(fromHuman(x)) returns x for representable prices', () => {
    const prices = ['0.9951', '1', '1.5', '2000', '0.0005', '1.00123', '99.99']

    it.each([
      { ltDecimals: 18, gtDecimals: 18 },
      { ltDecimals: 18, gtDecimals: 6 },
      { ltDecimals: 6, gtDecimals: 18 },
      { ltDecimals: 18, gtDecimals: 2 },
      { ltDecimals: 2, gtDecimals: 18 },
      { ltDecimals: 6, gtDecimals: 6 },
    ])('lt $ltDecimals / gt $gtDecimals decimals', ({ ltDecimals, gtDecimals }) => {
      const lt = { address: TOKEN_A, decimals: ltDecimals }
      const gt = { address: TOKEN_B, decimals: gtDecimals }
      const directions = [
        { quoteToken: lt, baseToken: gt },
        { quoteToken: gt, baseToken: lt },
      ]

      for (const pair of directions) {
        const quoteDecimals = pair.quoteToken.decimals
        const representable = prices.filter((p) => (p.split('.')[1] ?? '').length <= quoteDecimals)

        for (const human of representable) {
          const price = PeggedPrice.fromHuman(human, pair)
          expect(price.toHuman(pair.quoteToken.address), `${human} @${quoteDecimals}`).toBe(human)
        }
      }
    })
  })

  describe('toHuman rounding', () => {
    it('rounds half-up to the quote decimals', () => {
      const twoThirds = fromFraction('2', '3')
      expect(twoThirds.toHuman(TOKEN_B)).toBe('0.666666666666666667')
      expect(twoThirds.toHuman(TOKEN_A)).toBe('1.5')
      expect(fromFraction('1', '3').toHuman(TOKEN_B)).toBe('0.333333333333333333')
    })

    it('rounds an exact half up', () => {
      // 1.005 gt per lt with 18 lt / 2 gt decimals: raw = 1.005 * 10^2 / 10^18
      expect(fromFraction('1005', '10000000000000000000', 18, 2).toHuman(TOKEN_B)).toBe('1.01')
    })
  })

  describe('gtForLt / ltForGt', () => {
    const price = fromFraction('2', '3')

    it('round down', () => {
      expect(price.gtForLt(10n)).toBe(6n)
      expect(price.ltForGt(11n)).toBe(16n)
      expect(price.gtForLt(0n)).toBe(0n)
      expect(price.ltForGt(0n)).toBe(0n)
    })

    it('reject negative amounts', () => {
      expect(() => price.gtForLt(-1n)).toThrow('amount must be non-negative')
      expect(() => price.ltForGt(-1n)).toThrow('amount must be non-negative')
    })
  })

  describe('exact fraction', () => {
    it('is stored in lowest terms and compared by value', () => {
      const unreduced = fromFraction('6', '4')

      expect(unreduced.toJSON()).toMatchObject({ numerator: '3', denominator: '2' })
      expect(unreduced.equals(fromFraction('3', '2'))).toBe(true)
      expect(unreduced.equals(fromFraction('3', '1'))).toBe(false)
      expect(unreduced.equals(fromFraction('3', '2', 18, 6))).toBe(false)
    })

    it('rejects a non-positive fraction', () => {
      expect(() => fromFraction('0', '1')).toThrow('price must be positive')
      expect(() => fromFraction('1', '0')).toThrow('price must be positive')
    })

    it('toGtPerLtE18 rounds down once, at output', () => {
      const price = PeggedPrice.fromHuman('0.9993', {
        quoteToken: { address: TOKEN_A, decimals: 6 },
        baseToken: { address: TOKEN_B, decimals: 6 },
      })

      expect(price.toGtPerLtE18()).toBe(1_000_700_490_343_240_268n)
    })
  })

  describe('legacy JSON ({ gtPerLtRaw })', () => {
    it('parses the 18/18 snapshot', () => {
      const legacy = PeggedPrice.fromJSON({
        gtPerLtRaw: '1500000000000000000000000000000000000',
        tokenLt: { address: TOKEN_A.toString(), decimals: '18' },
        tokenGt: { address: TOKEN_B.toString(), decimals: '18' },
      })

      expect(legacy.equals(PeggedPrice.fromHuman('1.5', pairGtQuoteLtBase))).toBe(true)
      expect(legacy.toJSON()).toMatchObject({ numerator: '3', denominator: '2' })
    })

    it('parses a mixed-decimals snapshot (raw rate scaled by 10^(ltDecimals + gtDecimals))', () => {
      const legacy = PeggedPrice.fromJSON({
        gtPerLtRaw: '1002000000000',
        tokenLt: { address: TOKEN_A.toString(), decimals: '18' },
        tokenGt: { address: TOKEN_B.toString(), decimals: '6' },
      })
      const expected = PeggedPrice.fromHuman('1.002', {
        quoteToken: { address: TOKEN_B, decimals: 6 },
        baseToken: { address: TOKEN_A, decimals: 18 },
      })

      expect(legacy.equals(expected)).toBe(true)
      expect(legacy.toHuman(TOKEN_B)).toBe('1.002')
    })

    it('still requires canonical tokenLt < tokenGt order', () => {
      expect(() =>
        PeggedPrice.fromJSON({
          gtPerLtRaw: '1',
          tokenLt: { address: TOKEN_B.toString(), decimals: '18' },
          tokenGt: { address: TOKEN_A.toString(), decimals: '18' },
        }),
      ).toThrow('tokenLt address must be less than tokenGt')
    })
  })
})
