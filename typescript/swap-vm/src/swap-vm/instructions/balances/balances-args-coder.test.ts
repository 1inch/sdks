// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, AddressHalf } from '@1inch/sdk-core'
import { BalancesArgs } from './balances-args'
import { BalancesArgsCoder } from './balances-args-coder'

describe('BalancesArgsCoder', () => {
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

  const USDC_HALF = AddressHalf.fromAddress(USDC)
  const WETH_HALF = AddressHalf.fromAddress(WETH)

  it('should encode and decode balances', () => {
    const coder = new BalancesArgsCoder()

    const args = new BalancesArgs([
      { tokenHalf: USDC_HALF, value: 1000n * 10n ** 6n },
      { tokenHalf: WETH_HALF, value: 1n * 10n ** 18n },
    ])

    const encoded = coder.encode(args)
    expect(encoded.toString().startsWith('0x0002')).toBe(true)

    const decoded = coder.decode(encoded)
    expect(decoded.tokenBalances).toHaveLength(2)
    expect(decoded.tokenBalances[0].value).toBe(1000n * 10n ** 6n)
    expect(decoded.tokenBalances[1].value).toBe(1n * 10n ** 18n)

    expect(decoded.tokenBalances[0].tokenHalf.toString()).toBe(USDC_HALF.toString())
    expect(decoded.tokenBalances[1].tokenHalf.toString()).toBe(WETH_HALF.toString())
  })

  it('should use coder through BalancesArgs methods', () => {
    const args = new BalancesArgs([{ tokenHalf: USDC_HALF, value: 2000n }])

    const coder = BalancesArgs.CODER
    expect(coder).toBeDefined()

    const encoded = coder.encode(args)
    expect(encoded.toString()).toContain('0x0001')

    const decoded = BalancesArgs.decode(encoded)
    expect(decoded.tokenBalances).toHaveLength(1)
    expect(decoded.tokenBalances[0].value).toBe(2000n)
  })

  it('should encode token halves correctly', () => {
    const args = new BalancesArgs([{ tokenHalf: USDC_HALF, value: 100n }])

    const encoded = BalancesArgs.CODER.encode(args)
    const hex = encoded.toString()

    expect(hex.substring(0, 6)).toBe('0x0001') // Count
    expect(hex.substring(6, 26).toLowerCase()).toBe('9d4a2e9eb0ce3606eb48')

    const amountHex = hex.substring(26)
    expect(amountHex).toBe('0000000000000000000000000000000000000000000000000000000000000064')
  })
})
