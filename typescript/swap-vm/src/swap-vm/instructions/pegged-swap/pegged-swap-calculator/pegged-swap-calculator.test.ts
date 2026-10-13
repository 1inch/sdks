// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { PeggedSwapCalculator } from './pegged-swap-calculator'
import type { PeggedInitialBalances } from './types'
import { PeggedPrice } from '../price/pegged-price'
import type { PeggedPricePair, PeggedTokenRef } from '../price/types'

const TOKEN_A = new Address('0x0000000000000000000000000000000000000001')
const TOKEN_B = new Address('0x0000000000000000000000000000000000000002')
const LINEAR_WIDTH = 8n * 10n ** 26n

const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const USDT = new Address('0xdAC17F958D2ee523a2206206994597C13D831ec7')
const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')

const pairGtQuoteLtBase: PeggedPricePair = {
  quoteToken: { address: TOKEN_B, decimals: 18 },
  baseToken: { address: TOKEN_A, decimals: 18 },
}

/** Spot price of a pool deployed with `balances` (currentReserve = initialReserve). */
function openingPrice(
  tokenLt: PeggedTokenRef,
  tokenGt: PeggedTokenRef,
  balances: PeggedInitialBalances,
): PeggedPrice {
  return PeggedPrice.fromReserves({
    linearWidth: LINEAR_WIDTH,
    reserveA: {
      ...tokenLt,
      initialReserve: balances.reserveLt,
      currentReserve: balances.reserveLt,
    },
    reserveB: {
      ...tokenGt,
      initialReserve: balances.reserveGt,
      currentReserve: balances.reserveGt,
    },
  })
}

/** Asserts |actual - expected| / expected < 1 / parts, comparing the exact `toJSON` fractions. */
function expectRelativeErrorBelow(actual: PeggedPrice, expected: PeggedPrice, parts: bigint): void {
  const a = actual.toJSON()
  const e = expected.toJSON()
  const actualCross = BigInt(a.numerator) * BigInt(e.denominator)
  const expectedCross = BigInt(e.numerator) * BigInt(a.denominator)
  const deviation =
    actualCross > expectedCross ? actualCross - expectedCross : expectedCross - actualCross

  expect(deviation * parts).toBeLessThan(expectedCross)
}

describe('PeggedSwapCalculator', () => {
  const calculator = PeggedSwapCalculator.new({
    tokenA: { address: TOKEN_A, decimals: 18 },
    tokenB: { address: TOKEN_B, decimals: 18 },
  })

  it('computeFixedAllocation derives initial Gt from fixed Lt', () => {
    const spot = PeggedPrice.fromHuman('1.5', pairGtQuoteLtBase)
    const fixedLt = 10n ** 18n

    const balances = calculator.computeFixedAllocation(spot, TOKEN_A, fixedLt)

    expect(balances.reserveLt).toBe(fixedLt)
    expect(balances.reserveGt).toBe(15n * 10n ** 17n)

    const price = PeggedPrice.fromReserves({
      linearWidth: LINEAR_WIDTH,
      reserveA: {
        address: TOKEN_A,
        decimals: 18,
        initialReserve: balances.reserveLt,
        currentReserve: balances.reserveLt,
      },
      reserveB: {
        address: TOKEN_B,
        decimals: 18,
        initialReserve: balances.reserveGt,
        currentReserve: balances.reserveGt,
      },
    })

    expect(price.toHuman(TOKEN_B)).toBe('1.5')
  })

  it('computeFixedAllocation derives initial Lt from fixed Gt (6 / 18 decimals)', () => {
    const calc = PeggedSwapCalculator.new({
      tokenA: { address: TOKEN_A, decimals: 6 },
      tokenB: { address: TOKEN_B, decimals: 18 },
    })

    const spot = PeggedPrice.fromHuman('2', {
      quoteToken: { address: TOKEN_B, decimals: 18 },
      baseToken: { address: TOKEN_A, decimals: 6 },
    })

    const balances = calc.computeFixedAllocation(spot, TOKEN_B, 2n * 10n ** 18n)

    expect(balances.reserveGt).toBe(2n * 10n ** 18n)
    expect(balances.reserveLt).toBe(1n * 10n ** 6n)

    const price = PeggedPrice.fromReserves({
      linearWidth: LINEAR_WIDTH,
      reserveA: {
        address: TOKEN_A,
        decimals: 6,
        initialReserve: balances.reserveLt,
        currentReserve: balances.reserveLt,
      },
      reserveB: {
        address: TOKEN_B,
        decimals: 18,
        initialReserve: balances.reserveGt,
        currentReserve: balances.reserveGt,
      },
    })

    expect(price.toHuman(TOKEN_B)).toBe('2')
  })

  describe('stablecoin pairs', () => {
    it('USDC/USDT: 0.998 USDT per 1 USDC with 1M USDC fixed', () => {
      const calculator = PeggedSwapCalculator.new({
        tokenA: { address: USDC, decimals: 6 },
        tokenB: { address: USDT, decimals: 6 },
      })

      const spot = PeggedPrice.fromHuman('0.998', {
        quoteToken: { address: USDT, decimals: 6 },
        baseToken: { address: USDC, decimals: 6 },
      })

      const fixedUsdc = 1_000_000n * 10n ** 6n
      const balances = calculator.computeFixedAllocation(spot, USDC, fixedUsdc)

      expect(balances.reserveLt).toBe(fixedUsdc)
      expect(balances.reserveGt).toBe(998_000n * 10n ** 6n)

      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: {
          address: USDC,
          decimals: 6,
          initialReserve: balances.reserveLt,
          currentReserve: balances.reserveLt,
        },
        reserveB: {
          address: USDT,
          decimals: 6,
          initialReserve: balances.reserveGt,
          currentReserve: balances.reserveGt,
        },
      })

      expect(price.toHuman(USDT)).toBe('0.998')
    })

    it('DAI/USDC: 1.002 USDC per 1 DAI with 1M DAI fixed', () => {
      const calculator = PeggedSwapCalculator.new({
        tokenA: { address: DAI, decimals: 18 },
        tokenB: { address: USDC, decimals: 6 },
      })

      const spot = PeggedPrice.fromHuman('1.002', {
        quoteToken: { address: USDC, decimals: 6 },
        baseToken: { address: DAI, decimals: 18 },
      })

      const fixedDai = 1_000_000n * 10n ** 18n
      const balances = calculator.computeFixedAllocation(spot, DAI, fixedDai)

      expect(balances.reserveLt).toBe(fixedDai)
      expect(balances.reserveGt).toBe(1_002_000n * 10n ** 6n)

      const price = PeggedPrice.fromReserves({
        linearWidth: LINEAR_WIDTH,
        reserveA: {
          address: DAI,
          decimals: 18,
          initialReserve: balances.reserveLt,
          currentReserve: balances.reserveLt,
        },
        reserveB: {
          address: USDC,
          decimals: 6,
          initialReserve: balances.reserveGt,
          currentReserve: balances.reserveGt,
        },
      })

      expect(price.toHuman(USDC)).toBe('1.002')
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
    const calculator = PeggedSwapCalculator.new({ tokenA: PDAI, tokenB: PEURS })
    const spot = PeggedPrice.fromHuman('0.9951', { quoteToken: PDAI, baseToken: PEURS })
    const fixedPdai = 100_000n * 10n ** 18n

    it('sizes PEURS at the configured price for a fixed PDAI deposit', () => {
      const balances = calculator.computeFixedAllocation(spot, PDAI.address, fixedPdai)

      expect(balances).toEqual({ reserveLt: fixedPdai, reserveGt: 10_049_241n })
      expectRelativeErrorBelow(openingPrice(PDAI, PEURS, balances), spot, balances.reserveGt)
    })

    it('returns the PDAI deposit within one raw PEURS unit when fixing the PEURS side', () => {
      const balances = calculator.computeFixedAllocation(spot, PEURS.address, 10_049_241n)

      expect(balances).toEqual({ reserveLt: 99_999_997_191n * 10n ** 12n, reserveGt: 10_049_241n })
      expect(fixedPdai - balances.reserveLt).toBeLessThan(spot.ltForGt(1n))
      expectRelativeErrorBelow(openingPrice(PDAI, PEURS, balances), spot, balances.reserveLt)
    })
  })

  describe('opening price matches the configured price within rounding', () => {
    it.each([
      { ltDecimals: 18, gtDecimals: 6, human: '0.9993', quote: 'lt' },
      { ltDecimals: 18, gtDecimals: 2, human: '0.9951', quote: 'lt' },
      { ltDecimals: 6, gtDecimals: 18, human: '1.0007', quote: 'gt' },
      { ltDecimals: 6, gtDecimals: 18, human: '0.9993', quote: 'lt' },
      { ltDecimals: 18, gtDecimals: 18, human: '1.00123', quote: 'gt' },
    ])(
      'lt $ltDecimals / gt $gtDecimals decimals at $human ($quote quote)',
      ({ ltDecimals, gtDecimals, human, quote }) => {
        const tokenLt = { address: TOKEN_A, decimals: ltDecimals }
        const tokenGt = { address: TOKEN_B, decimals: gtDecimals }
        const calc = PeggedSwapCalculator.new({ tokenA: tokenLt, tokenB: tokenGt })
        const spot = PeggedPrice.fromHuman(
          human,
          quote === 'lt'
            ? { quoteToken: tokenLt, baseToken: tokenGt }
            : { quoteToken: tokenGt, baseToken: tokenLt },
        )

        const fixedLt = calc.computeFixedAllocation(
          spot,
          TOKEN_A,
          1_000_000n * 10n ** BigInt(ltDecimals),
        )
        expectRelativeErrorBelow(openingPrice(tokenLt, tokenGt, fixedLt), spot, fixedLt.reserveGt)

        const fixedGt = calc.computeFixedAllocation(
          spot,
          TOKEN_B,
          1_000_000n * 10n ** BigInt(gtDecimals),
        )
        expectRelativeErrorBelow(openingPrice(tokenLt, tokenGt, fixedGt), spot, fixedGt.reserveLt)
      },
    )
  })

  it('should reject a token that is not in the pair', () => {
    const other = new Address('0x0000000000000000000000000000000000000009')
    const spot = PeggedPrice.fromHuman('1', pairGtQuoteLtBase)

    expect(() => calculator.computeFixedAllocation(spot, other, 1n)).toThrow(
      'fixedReserveForToken token must be one of the two pair tokens',
    )
  })
})
