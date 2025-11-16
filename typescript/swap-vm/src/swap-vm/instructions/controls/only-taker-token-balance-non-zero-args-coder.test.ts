// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { OnlyTakerTokenBalanceNonZeroArgs } from './only-taker-token-balance-non-zero-args'
import { OnlyTakerTokenBalanceNonZeroArgsCoder } from './only-taker-token-balance-non-zero-args-coder'

describe('OnlyTakerTokenBalanceNonZeroArgsCoder', () => {
  const coder = new OnlyTakerTokenBalanceNonZeroArgsCoder()
  const USDC = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

  it('should encode and decode args', () => {
    const args = new OnlyTakerTokenBalanceNonZeroArgs(USDC)

    const encoded = coder.encode(args)
    expect(encoded.toString().toLowerCase()).toBe(USDC.toString().toLowerCase())

    const decoded = coder.decode(encoded)
    expect(decoded.token.toString().toLowerCase()).toBe(USDC.toString().toLowerCase())
  })

  it('should use static decode method', () => {
    const encoded = new HexString(USDC.toString())
    const decoded = OnlyTakerTokenBalanceNonZeroArgs.decode(encoded)
    expect(decoded.token.toString().toLowerCase()).toBe(USDC.toString().toLowerCase())
  })

  it('should convert to JSON', () => {
    const args = new OnlyTakerTokenBalanceNonZeroArgs(USDC)
    expect(args.toJSON()).toEqual({
      token: USDC.toString(),
    })
  })
})
