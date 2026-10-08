// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { BalancesArgs } from './balances-args'

describe('BalancesArgs', () => {
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
  const WETH = new Address('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
  const DAI = new Address('0x6B175474E89094C44Da98b954EedeAC495271d0F')

  const UINT256_ONE = '00'.repeat(31) + '01'

  it('should accept balances for two or more distinct tokens', () => {
    const pair = new BalancesArgs([
      { token: USDC, value: 1n },
      { token: WETH, value: 2n },
    ])
    const triple = new BalancesArgs([
      { token: USDC, value: 1n },
      { token: WETH, value: 2n },
      { token: DAI, value: 3n },
    ])

    expect(pair.tokenBalances).toHaveLength(2)
    expect(triple.tokenBalances).toHaveLength(3)
  })

  it('should reject fewer than two token balances', () => {
    expect(() => new BalancesArgs([])).toThrow('Invalid tokenBalances length: 0')
    expect(() => new BalancesArgs([{ token: USDC, value: 1n }])).toThrow(
      'Invalid tokenBalances length: 1. Must set balances for at least 2 tokens (tokenIn and tokenOut)',
    )
  })

  it('should reject duplicate tokens', () => {
    const lowercaseUsdc = new Address('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')

    expect(
      () =>
        new BalancesArgs([
          { token: USDC, value: 1n },
          { token: lowercaseUsdc, value: 2n },
        ]),
    ).toThrow(`Invalid tokenBalances: duplicate token ${USDC.toString()}`)

    expect(
      () =>
        new BalancesArgs([
          { token: USDC, value: 1n },
          { token: WETH, value: 2n },
          { token: DAI, value: 3n },
          { token: WETH, value: 4n },
        ]),
    ).toThrow(`Invalid tokenBalances: duplicate token ${WETH.toString()}`)
  })

  it('should reject a single-token payload when decoding', () => {
    const singleToken = new HexString('0x0001' + USDC.toString().slice(2) + UINT256_ONE)

    expect(() => BalancesArgs.decode(singleToken)).toThrow('Invalid tokenBalances length: 1')
  })

  it('should reject a payload with duplicate tokens when decoding', () => {
    const duplicateTokens = new HexString(
      '0x0002' + USDC.toString().slice(2).repeat(2) + UINT256_ONE.repeat(2),
    )

    expect(() => BalancesArgs.decode(duplicateTokens)).toThrow(
      `Invalid tokenBalances: duplicate token ${USDC.toString()}`,
    )
  })
})
