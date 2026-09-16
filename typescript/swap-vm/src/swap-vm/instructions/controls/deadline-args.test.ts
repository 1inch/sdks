// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { DeadlineArgs } from './deadline-args'
import { DeadlineArgsCoder } from './deadline-args-coder'

describe('DeadlineArgs', () => {
  const coder = new DeadlineArgsCoder()

  it('should encode and decode a deadline', () => {
    const args = new DeadlineArgs(1735689600n)
    const encoded = coder.encode(args)
    const decoded = DeadlineArgs.decode(encoded)

    expect(decoded.deadline).toBe(1735689600n)
    expect(args.toJSON()).toEqual({ deadline: '1735689600' })
  })

  it('should round-trip zero', () => {
    const args = new DeadlineArgs(0n)
    const decoded = coder.decode(coder.encode(args))

    expect(decoded.deadline).toBe(0n)
  })
})
