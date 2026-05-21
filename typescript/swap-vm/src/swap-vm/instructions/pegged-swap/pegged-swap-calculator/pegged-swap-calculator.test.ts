// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, expect, it } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { PeggedSwapCalculator } from './pegged-swap-calculator'
import { PeggedPrice } from '../price/pegged-price'
import type { PeggedPricePair } from '../price/types'

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
})
