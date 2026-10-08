// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { BalancesArgs } from './balances-args'
import { BalancesArgsCoder } from './balances-args-coder'

describe('BalancesArgsCoder', () => {
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

  const TOKEN_1 = new Address('0x1111111111111111111111111111111111111111')
  const TOKEN_2 = new Address('0x2222222222222222222222222222222222222222')

  // BalancesArgsBuilder.build([TOKEN_1, TOKEN_2], [1, 2])
  const SOLIDITY_TOKEN_1_2_HEX =
    '0x0002' +
    '11'.repeat(20) +
    '22'.repeat(20) +
    '0000000000000000000000000000000000000000000000000000000000000001' +
    '0000000000000000000000000000000000000000000000000000000000000002'

  // BalancesArgsBuilder.build([USDC, WETH], [1000e6, 1e18])
  const SOLIDITY_USDC_WETH_HEX =
    '0x0002' +
    'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' +
    'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' +
    '000000000000000000000000000000000000000000000000000000003b9aca00' +
    '0000000000000000000000000000000000000000000000000de0b6b3a7640000'

  it('should encode and decode balances', () => {
    const coder = new BalancesArgsCoder()

    const args = new BalancesArgs([
      { token: USDC, value: 1000n * 10n ** 6n },
      { token: WETH, value: 1n * 10n ** 18n },
    ])

    const encoded = coder.encode(args)
    expect(encoded.toString()).toBe(SOLIDITY_USDC_WETH_HEX)

    const decoded = coder.decode(encoded)
    expect(decoded.tokenBalances).toHaveLength(2)
    expect(decoded.tokenBalances[0].value).toBe(1000n * 10n ** 6n)
    expect(decoded.tokenBalances[1].value).toBe(1n * 10n ** 18n)

    expect(decoded.tokenBalances[0].token.equal(USDC)).toBe(true)
    expect(decoded.tokenBalances[1].token.equal(WETH)).toBe(true)
  })

  it('should match BalancesArgsBuilder.build byte layout', () => {
    const args = new BalancesArgs([
      { token: TOKEN_1, value: 1n },
      { token: TOKEN_2, value: 2n },
    ])

    const encoded = BalancesArgs.CODER.encode(args)

    expect(encoded.toString()).toBe(SOLIDITY_TOKEN_1_2_HEX)
    expect(encoded.bytesCount()).toBe(2 + 2 * 20 + 2 * 32)
  })

  it('should decode bytes produced by BalancesArgsBuilder.build into full addresses', () => {
    const decoded = BalancesArgs.decode(new HexString(SOLIDITY_TOKEN_1_2_HEX))

    expect(decoded.tokenBalances).toHaveLength(2)
    expect(decoded.tokenBalances[0].token.toString()).toBe(TOKEN_1.toString())
    expect(decoded.tokenBalances[0].value).toBe(1n)
    expect(decoded.tokenBalances[1].token.toString()).toBe(TOKEN_2.toString())
    expect(decoded.tokenBalances[1].value).toBe(2n)
  })

  it('should use coder through BalancesArgs methods', () => {
    const args = new BalancesArgs([{ token: USDC, value: 2000n }])

    const coder = BalancesArgs.CODER
    expect(coder).toBeDefined()

    const encoded = coder.encode(args)
    expect(encoded.toString()).toContain('0x0001')

    const decoded = BalancesArgs.decode(encoded)
    expect(decoded.tokenBalances).toHaveLength(1)
    expect(decoded.tokenBalances[0].value).toBe(2000n)
  })

  it('should encode full 20-byte token addresses', () => {
    const args = new BalancesArgs([{ token: USDC, value: 100n }])

    const encoded = BalancesArgs.CODER.encode(args)
    const hex = encoded.toString()

    expect(hex.substring(0, 6)).toBe('0x0001') // Count
    expect(hex.substring(6, 46)).toBe('a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')

    const amountHex = hex.substring(46)
    expect(amountHex).toBe('0000000000000000000000000000000000000000000000000000000000000064')
  })

  it('should reject data using truncated 10-byte token tails', () => {
    const truncatedLayout = new HexString(
      '0x0001' +
        '9d4a2e9eb0ce3606eb48' +
        '0000000000000000000000000000000000000000000000000000000000000064',
    )

    expect(() => BalancesArgs.decode(truncatedLayout)).toThrow('Can not consume 32 bytes')
  })

  it('should convert balances to JSON', () => {
    const args = new BalancesArgs([{ token: USDC, value: 2000n }])

    expect(args.toJSON()).toEqual({
      tokenBalances: [{ token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', value: '2000' }],
    })
  })
})
