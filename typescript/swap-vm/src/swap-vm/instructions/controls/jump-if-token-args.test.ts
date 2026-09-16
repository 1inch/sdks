// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, AddressHalf } from '@1inch/sdk-core'
import { JumpIfTokenArgs } from './jump-if-token-args'

describe('JumpIfTokenArgs', () => {
  const tokenTail = AddressHalf.fromAddress(
    new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
  )

  it('should encode, decode and serialize to JSON', () => {
    const args = new JumpIfTokenArgs(tokenTail, 12n)
    const decoded = JumpIfTokenArgs.decode(JumpIfTokenArgs.CODER.encode(args))

    expect(decoded.tokenTail.toString()).toBe(tokenTail.toString())
    expect(decoded.nextPC).toBe(12n)
    expect(args.toJSON()).toEqual({
      tokenTail: tokenTail.toString(),
      nextPC: 12n,
    })
  })
})
