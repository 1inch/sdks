// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { InvalidateTokenOut1DArgs } from './invalidate-token-out-1d-args'
import { InvalidateTokenOut1DArgsCoder } from './invalidate-token-out-1d-args-coder'

describe('InvalidateTokenOut1DArgs', () => {
  it('should encode and decode empty args', () => {
    const coder = new InvalidateTokenOut1DArgsCoder()
    const args = new InvalidateTokenOut1DArgs()

    const encoded = coder.encode(args)
    expect(encoded.toString()).toBe('0x')

    const decoded = coder.decode(encoded)
    expect(decoded).toBeInstanceOf(InvalidateTokenOut1DArgs)
  })

  it('should use static decode method', () => {
    const coder = new InvalidateTokenOut1DArgsCoder()
    const args = new InvalidateTokenOut1DArgs()
    const encoded = coder.encode(args)

    const decoded = InvalidateTokenOut1DArgs.decode(encoded)
    expect(decoded).toBeInstanceOf(InvalidateTokenOut1DArgs)
  })

  it('should convert to JSON', () => {
    const args = new InvalidateTokenOut1DArgs()
    const json = args.toJSON()

    expect(json).toEqual({})
  })

  it('should handle encoding and decoding consistently', () => {
    const args = new InvalidateTokenOut1DArgs()
    const coder = new InvalidateTokenOut1DArgsCoder()
    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded).toBeInstanceOf(InvalidateTokenOut1DArgs)
    expect(encoded.toString()).toBe('0x')
  })
})
