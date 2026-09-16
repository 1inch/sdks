// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { ExtructionArgs } from './extruction-args'

describe('ExtructionArgs', () => {
  const target = new Address('0x1111111111111111111111111111111111111111')
  const payload = new HexString('0xabcdef')

  it('should encode, decode and serialize to JSON', () => {
    const args = new ExtructionArgs(target, payload)
    const decoded = ExtructionArgs.decode(ExtructionArgs.CODER.encode(args))

    expect(decoded.target.equal(target)).toBe(true)
    expect(decoded.extructionArgs.equal(payload)).toBe(true)
    expect(args.toJSON()).toEqual({
      target: target.toString(),
      extructionArgs: payload.toString(),
    })
  })
})
