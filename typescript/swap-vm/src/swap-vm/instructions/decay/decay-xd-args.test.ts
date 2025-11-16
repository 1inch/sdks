// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { DecayXDArgs } from './decay-xd-args'
import { DecayXDArgsCoder } from './decay-xd-args-coder'

describe('DecayXDArgs', () => {
  const coder = new DecayXDArgsCoder()

  it('should encode and decode decay period', () => {
    const decayPeriod = 3600n
    const args = new DecayXDArgs(decayPeriod)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(6)

    const decoded = coder.decode(encoded)
    expect(decoded.decayPeriod).toBe(decayPeriod)
  })

  it('should handle zero decay period', () => {
    const args = new DecayXDArgs(0n)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.decayPeriod).toBe(0n)
  })

  it('should handle max uint16 decay period', () => {
    const maxUint16 = 2n ** 16n - 1n
    const args = new DecayXDArgs(maxUint16)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.decayPeriod).toBe(maxUint16)
  })

  it('should throw for decay period greater than uint16', () => {
    const tooLarge = 2n ** 16n
    expect(() => new DecayXDArgs(tooLarge)).toThrow('Must be a valid uint16')
  })

  it('should throw for negative decay period', () => {
    expect(() => new DecayXDArgs(-1n)).toThrow('Must be a valid uint16')
  })

  it('should use static decode method', () => {
    const args = new DecayXDArgs(1234n)
    const encoded = coder.encode(args)

    const decoded = DecayXDArgs.decode(encoded)
    expect(decoded.decayPeriod).toBe(1234n)
  })

  it('should convert to JSON', () => {
    const args = new DecayXDArgs(43200n)
    const json = args.toJSON()

    expect(json).toEqual({
      decayPeriod: '43200',
    })
  })
})
