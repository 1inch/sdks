// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { OnlyTxOriginTokenBalanceNonZeroArgs } from './only-tx-origin-token-balance-non-zero-args'
import { OnlyTxOriginTokenBalanceNonZeroArgsCoder } from './only-tx-origin-token-balance-non-zero-args-coder'

describe('OnlyTxOriginTokenBalanceNonZeroArgsCoder', () => {
  const coder = new OnlyTxOriginTokenBalanceNonZeroArgsCoder()
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

  it('should encode and decode args', () => {
    const args = new OnlyTxOriginTokenBalanceNonZeroArgs(USDC)

    const encoded = coder.encode(args)
    expect(encoded.toString().toLowerCase()).toBe(USDC.toString().toLowerCase())

    const decoded = coder.decode(encoded)
    expect(decoded.token.toString().toLowerCase()).toBe(USDC.toString().toLowerCase())
  })

  it('should use static decode method', () => {
    const encoded = new HexString(USDC.toString())
    const decoded = OnlyTxOriginTokenBalanceNonZeroArgs.decode(encoded)
    expect(decoded.token.toString().toLowerCase()).toBe(USDC.toString().toLowerCase())
  })

  it('should convert to JSON', () => {
    const args = new OnlyTxOriginTokenBalanceNonZeroArgs(USDC)
    expect(args.toJSON()).toEqual({
      token: USDC.toString(),
    })
  })
})
