// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { LimitSwapDirectionArgs } from './limit-swap-direction-args'

describe('LimitSwapDirectionArgs', () => {
  it('should encode and decode limit swap direction args with true', () => {
    const args = new LimitSwapDirectionArgs(true)

    const encoded = LimitSwapDirectionArgs.CODER.encode(args)
    expect(encoded.toString()).toBe('0x01')

    const decoded = LimitSwapDirectionArgs.decode(encoded)
    expect(decoded.makerDirectionLt).toBe(true)
  })

  it('should encode and decode limit swap direction args with false', () => {
    const args = new LimitSwapDirectionArgs(false)

    const encoded = LimitSwapDirectionArgs.CODER.encode(args)
    expect(encoded.toString()).toBe('0x00')

    const decoded = LimitSwapDirectionArgs.decode(encoded)
    expect(decoded.makerDirectionLt).toBe(false)
  })

  it('should convert to JSON correctly', () => {
    const args = new LimitSwapDirectionArgs(true)
    const json = args.toJSON()

    expect(json).toEqual({
      makerDirectionLt: true,
    })
  })

  it('should decode from hex string', () => {
    const hex = new HexString('0x01')
    const decoded = LimitSwapDirectionArgs.decode(hex)
    expect(decoded.makerDirectionLt).toBe(true)

    const hex2 = new HexString('0x00')
    const decoded2 = LimitSwapDirectionArgs.decode(hex2)
    expect(decoded2.makerDirectionLt).toBe(false)
  })
})
