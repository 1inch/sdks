// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { InvalidateTokenIn1DArgs } from './invalidate-token-in-1d-args'
import { InvalidateTokenIn1DArgsCoder } from './invalidate-token-in-1d-args-coder'

describe('InvalidateTokenIn1DArgs', () => {
  it('should encode and decode empty args', () => {
    const coder = new InvalidateTokenIn1DArgsCoder()
    const args = new InvalidateTokenIn1DArgs()

    const encoded = coder.encode(args)
    expect(encoded.toString()).toBe('0x')

    const decoded = coder.decode(encoded)
    expect(decoded).toBeInstanceOf(InvalidateTokenIn1DArgs)
  })

  it('should use static decode method', () => {
    const coder = new InvalidateTokenIn1DArgsCoder()
    const args = new InvalidateTokenIn1DArgs()
    const encoded = coder.encode(args)

    const decoded = InvalidateTokenIn1DArgs.decode(encoded)
    expect(decoded).toBeInstanceOf(InvalidateTokenIn1DArgs)
  })

  it('should convert to JSON', () => {
    const args = new InvalidateTokenIn1DArgs()
    const json = args.toJSON()

    expect(json).toEqual({})
  })

  it('should handle encoding and decoding consistently', () => {
    const args = new InvalidateTokenIn1DArgs()
    const coder = new InvalidateTokenIn1DArgsCoder()
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded).toBeInstanceOf(InvalidateTokenIn1DArgs)
    expect(encoded.toString()).toBe('0x')
  })
})
