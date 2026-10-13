// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { SaltArgs } from './salt-args'
import { SaltArgsCoder } from './salt-args-coder'

describe('SaltArgs', () => {
  const coder = new SaltArgsCoder()

  it('should encode and decode uint64 salt via fromUint64', () => {
    const salt = 0x1234567890n
    const args = SaltArgs.fromUint64(salt)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(18)

    const decoded = coder.decode(encoded)
    expect(decoded.bytes).toEqual(args.bytes)
  })

  it('should handle zero salt', () => {
    const args = SaltArgs.fromUint64(0n)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.bytes).toEqual(args.bytes)
  })

  it('should handle max uint64 salt', () => {
    const maxUint64 = 2n ** 64n - 1n
    const args = SaltArgs.fromUint64(maxUint64)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.bytes).toEqual(args.bytes)
  })

  it('should throw for salt greater than uint64', () => {
    const tooLarge = 2n ** 64n
    expect(() => SaltArgs.fromUint64(tooLarge)).toThrow('Must be a valid uint64')
  })

  it('should throw for negative salt', () => {
    expect(() => SaltArgs.fromUint64(-1n)).toThrow('Must be a valid uint64')
  })

  it('should use static decode method', () => {
    const args = SaltArgs.fromUint64(9999n)
    const encoded = coder.encode(args)

    const decoded = SaltArgs.decode(encoded)
    expect(decoded.bytes).toEqual(args.bytes)
  })

  it('should convert to JSON', () => {
    const args = SaltArgs.fromUint64(42n)
    const json = args.toJSON()

    expect(json).toEqual({
      bytes: '0x000000000000002a',
    })
  })

  it('should encode expected hex format for uint64', () => {
    const args = SaltArgs.fromUint64(0x1234567890abcdefn)
    const encoded = coder.encode(args)

    expect(encoded.toString().toLowerCase()).toBe('0x1234567890abcdef')
  })

  it('should expose the 8-byte encoding of a bigint salt', () => {
    const args = SaltArgs.fromUint64(0x1234n)

    expect(args.bytes.toString()).toBe('0x0000000000001234')
  })

  it.each([
    ['0 bytes', '0x'],
    ['4 bytes', '0xdeadbeef'],
    ['8 bytes', '0x0102030405060708'],
    ['32 bytes', '0x' + 'ab'.repeat(32)],
  ])('should keep a raw salt of %s verbatim', (_name, hex) => {
    const args = new SaltArgs(new HexString(hex))

    expect(args.bytes.toString()).toBe(hex)
    expect(coder.encode(args).toString()).toBe(hex)

    const decoded = SaltArgs.decode(coder.encode(args))
    expect(decoded.bytes.toString()).toBe(hex)
  })

  it('should allow an empty salt', () => {
    const args = new SaltArgs(HexString.EMPTY)

    expect(args.bytes.isEmpty()).toBe(true)
  })

  it('should keep leading zero bytes of a raw salt', () => {
    const raw = new SaltArgs(new HexString('0x00000001'))
    const uint64 = SaltArgs.fromUint64(1n)

    expect(raw.bytes.toString()).toBe('0x00000001')
    expect(uint64.bytes.toString()).toBe('0x0000000000000001')
  })

  it('should produce the same on-chain bytes for uint64 and matching raw form', () => {
    const fromUint64 = SaltArgs.fromUint64(0x1234567890abcdefn)
    const fromBytes = new SaltArgs(new HexString('0x1234567890abcdef'))

    expect(coder.encode(fromBytes).toString()).toBe(coder.encode(fromUint64).toString())
  })

  it('should convert raw salt bytes to JSON', () => {
    const args = new SaltArgs(new HexString('0xdeadbeef'))

    expect(args.toJSON()).toEqual({
      bytes: '0xdeadbeef',
    })
    expect(new SaltArgs(HexString.EMPTY).toJSON()).toEqual({
      bytes: '0x',
    })
  })
})
