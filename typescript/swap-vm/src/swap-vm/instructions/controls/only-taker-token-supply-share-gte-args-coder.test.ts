// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address } from '@1inch/sdk-core'
import { UINT_64_MAX } from '@1inch/byte-utils'
import { OnlyTakerTokenSupplyShareGteArgs } from './only-taker-token-supply-share-gte-args'
import { OnlyTakerTokenSupplyShareGteArgsCoder } from './only-taker-token-supply-share-gte-args-coder'

describe('OnlyTakerTokenSupplyShareGteArgsCoder', () => {
  const coder = new OnlyTakerTokenSupplyShareGteArgsCoder()
  const TOKEN = new Address('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

  it('should encode and decode args', () => {
    const minShareE18 = 500000000000000000n
    const args = new OnlyTakerTokenSupplyShareGteArgs(TOKEN, minShareE18)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(2 + 40 + 16) // 0x + address + uint64

    const decoded = coder.decode(encoded)
    expect(decoded.token.toString()).toBe(TOKEN.toString())
    expect(decoded.minShareE18).toBe(minShareE18)
  })

  it('should handle 100% share', () => {
    const fullShare = 1000000000000000000n
    const args = new OnlyTakerTokenSupplyShareGteArgs(TOKEN, fullShare)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.minShareE18).toBe(fullShare)
  })

  it('should handle minimum share', () => {
    const args = new OnlyTakerTokenSupplyShareGteArgs(TOKEN, 1n)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.minShareE18).toBe(1n)
  })

  it('should handle max uint64 value', () => {
    const maxUint64 = UINT_64_MAX
    const args = new OnlyTakerTokenSupplyShareGteArgs(TOKEN, maxUint64)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.minShareE18).toBe(maxUint64)
  })

  it('should throw on values larger than uint64', () => {
    const tooLarge = UINT_64_MAX + 1n
    expect(() => new OnlyTakerTokenSupplyShareGteArgs(TOKEN, tooLarge)).toThrow(
      'Invalid minShareE18 value',
    )
  })

  it('should use static decode method', () => {
    const args = new OnlyTakerTokenSupplyShareGteArgs(TOKEN, 250000000000000000n)
    const encoded = coder.encode(args)

    const decoded = OnlyTakerTokenSupplyShareGteArgs.decode(encoded)
    expect(decoded.token.toString().toLowerCase()).toBe(TOKEN.toString().toLowerCase())
    expect(decoded.minShareE18).toBe(250000000000000000n)
  })

  it('should convert to JSON', () => {
    const args = new OnlyTakerTokenSupplyShareGteArgs(TOKEN, 100000000000000000n)
    expect(args.toJSON()).toEqual({
      token: TOKEN.toString(),
      minShareE18: '100000000000000000',
    })
  })
})
