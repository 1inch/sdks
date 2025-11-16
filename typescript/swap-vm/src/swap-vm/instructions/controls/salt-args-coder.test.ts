// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { UINT_64_MAX } from '@1inch/byte-utils'
import { SaltArgs } from './salt-args'
import { SaltArgsCoder } from './salt-args-coder'

describe('SaltArgsCoder', () => {
  const coder = new SaltArgsCoder()

  it('should encode salt as uint64', () => {
    const args = new SaltArgs(0x123n)
    const encoded = coder.encode(args)

    const hex = encoded.toString()
    expect(hex.substring(2).length).toBe(16)

    expect(hex).toBe('0x0000000000000123')
  })

  it('should decode uint64 salt', () => {
    const hex = new HexString('0x0000000000001234')
    const decoded = coder.decode(hex)

    expect(decoded.salt).toBe(0x1234n)
  })

  it('should handle full uint64 values', () => {
    const args = new SaltArgs(UINT_64_MAX)

    const encoded = coder.encode(args)
    expect(encoded.toString()).toBe('0xffffffffffffffff')

    const decoded = coder.decode(encoded)
    expect(decoded.salt).toBe(UINT_64_MAX)
  })

  it('should maintain salt uniqueness', () => {
    const salt1 = new SaltArgs(0x1n)
    const salt2 = new SaltArgs(0x2n)

    const encoded1 = coder.encode(salt1)
    const encoded2 = coder.encode(salt2)

    expect(encoded1.toString()).not.toBe(encoded2.toString())
  })
})
