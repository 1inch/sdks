// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { DeadlineArgs } from './deadline-args'
import { DeadlineArgsCoder } from './deadline-args-coder'

describe('DeadlineArgs', () => {
  const coder = new DeadlineArgsCoder()
  const maxUint40 = (1n << 40n) - 1n

  it('should encode and decode a deadline', () => {
    const args = new DeadlineArgs(1735689600n)
    const encoded = coder.encode(args)
    const decoded = DeadlineArgs.decode(encoded)

    expect(decoded.deadline).toBe(1735689600n)
    expect(args.toJSON()).toEqual({ deadline: '1735689600' })
  })

  it('should round-trip the max uint40 deadline', () => {
    const encoded = coder.encode(new DeadlineArgs(maxUint40))

    expect(encoded.toString()).toBe('0xffffffffff')
    expect(coder.decode(encoded).deadline).toBe(maxUint40)
  })

  it('should reject a zero deadline', () => {
    expect(() => new DeadlineArgs(0n)).toThrow(
      'Invalid deadline: 0. Must be > 0 and <= UINT_40_MAX',
    )
  })

  it('should reject deadlines outside the uint40 range', () => {
    expect(() => new DeadlineArgs(-1n)).toThrow('Invalid deadline: -1')
    expect(() => new DeadlineArgs(maxUint40 + 1n)).toThrow(`Invalid deadline: ${maxUint40 + 1n}`)
  })

  it('should reject a zero deadline when decoding', () => {
    expect(() => DeadlineArgs.decode(new HexString('0x0000000000'))).toThrow('Invalid deadline: 0')
  })
})
