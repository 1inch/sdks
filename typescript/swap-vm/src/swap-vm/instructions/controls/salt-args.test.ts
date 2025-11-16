// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { SaltArgs } from './salt-args'
import { SaltArgsCoder } from './salt-args-coder'

describe('SaltArgs', () => {
  const coder = new SaltArgsCoder()

  it('should encode and decode salt', () => {
    const salt = 0x1234567890n
    const args = new SaltArgs(salt)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(18)

    const decoded = coder.decode(encoded)
    expect(decoded.salt).toBe(salt)
  })

  it('should handle zero salt', () => {
    const args = new SaltArgs(0n)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.salt).toBe(0n)
  })

  it('should handle max uint64 salt', () => {
    const maxUint64 = 2n ** 64n - 1n
    const args = new SaltArgs(maxUint64)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.salt).toBe(maxUint64)
  })

  it('should throw for salt greater than uint64', () => {
    const tooLarge = 2n ** 64n
    expect(() => new SaltArgs(tooLarge)).toThrow('Must be a valid uint64')
  })

  it('should throw for negative salt', () => {
    expect(() => new SaltArgs(-1n)).toThrow('Must be a valid uint64')
  })

  it('should use static decode method', () => {
    const args = new SaltArgs(9999n)
    const encoded = coder.encode(args)

    const decoded = SaltArgs.decode(encoded)
    expect(decoded.salt).toBe(9999n)
  })

  it('should convert to JSON', () => {
    const args = new SaltArgs(42n)
    const json = args.toJSON()

    expect(json).toEqual({
      salt: '42',
    })
  })

  it('should encode expected hex format', () => {
    const args = new SaltArgs(0x1234567890abcdefn)
    const encoded = coder.encode(args)

    expect(encoded.toString().toLowerCase()).toBe('0x1234567890abcdef')
  })
})
