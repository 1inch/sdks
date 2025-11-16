// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { InvalidateBit1DArgs } from './invalidate-bit-1d-args'
import { InvalidateBit1DArgsCoder } from './invalidate-bit-1d-args-coder'

describe('InvalidateBit1DArgs', () => {
  const coder = new InvalidateBit1DArgsCoder()

  it('should encode and decode bit index', () => {
    const bitIndex = 12345n
    const args = new InvalidateBit1DArgs(bitIndex)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(10)

    const decoded = coder.decode(encoded)
    expect(decoded.bitIndex).toBe(bitIndex)
  })

  it('should handle zero bit index', () => {
    const args = new InvalidateBit1DArgs(0n)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.bitIndex).toBe(0n)
  })

  it('should handle max uint32 bit index', () => {
    const maxUint32 = 2n ** 32n - 1n
    const args = new InvalidateBit1DArgs(maxUint32)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.bitIndex).toBe(maxUint32)
  })

  it('should throw for bit index greater than uint32', () => {
    const tooLarge = 2n ** 32n
    expect(() => new InvalidateBit1DArgs(tooLarge)).toThrow('Must be a valid uint32')
  })

  it('should throw for negative bit index', () => {
    expect(() => new InvalidateBit1DArgs(-1n)).toThrow('Must be a valid uint32')
  })

  it('should use static decode method', () => {
    const args = new InvalidateBit1DArgs(999n)
    const encoded = coder.encode(args)

    const decoded = InvalidateBit1DArgs.decode(encoded)
    expect(decoded.bitIndex).toBe(999n)
  })

  it('should convert to JSON', () => {
    const args = new InvalidateBit1DArgs(256n)
    const json = args.toJSON()

    expect(json).toEqual({
      bitIndex: '256',
    })
  })
})
