// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { UINT_16_MAX } from '@1inch/byte-utils'
import { JumpArgs } from './jump-args'
import { JumpArgsCoder } from './jump-args-coder'

describe('JumpArgsCoder', () => {
  const coder = new JumpArgsCoder()

  it('should encode and decode jump args', () => {
    const args = new JumpArgs(100n)

    const encoded = coder.encode(args)
    // 0x0064 (100 in hex)
    expect(encoded.toString()).toBe('0x0064')

    const decoded = coder.decode(encoded)
    expect(decoded.nextPC).toBe(100n)
  })

  it('should handle max uint16 value', () => {
    const args = new JumpArgs(UINT_16_MAX)

    const encoded = coder.encode(args)
    expect(encoded.toString()).toBe('0xffff')

    const decoded = coder.decode(encoded)
    expect(decoded.nextPC).toBe(65535n)
  })

  it('should handle zero', () => {
    const args = new JumpArgs(0n)

    const encoded = coder.encode(args)
    expect(encoded.toString()).toBe('0x0000')

    const decoded = coder.decode(encoded)
    expect(decoded.nextPC).toBe(0n)
  })

  it('should throw on invalid values', () => {
    expect(() => new JumpArgs(-1n)).toThrow('Invalid nextPC value')
    expect(() => new JumpArgs(1000000n)).toThrow('Invalid nextPC value')
  })

  it('should convert to JSON', () => {
    const args = new JumpArgs(42n)
    expect(args.toJSON()).toEqual({
      nextPC: 42n,
    })
  })
})
