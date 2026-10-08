// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { HexString } from '@1inch/sdk-core'
import { SaltArgs } from './salt-args'
import { SaltArgsCoder } from './salt-args-coder'

describe('SaltArgs', () => {
  const coder = new SaltArgsCoder()

  it('should encode and decode salt', () => {
    const salt = 0x1234567890n
    const args = new SaltArgs(salt)

    const encoded = coder.encode(args)
    expect(encoded.toString().length).toBe(18)

    const decoded = coder.decode(encoded)
    expect(decoded.salt).toBe(salt)
  })

  it('should handle zero salt', () => {
    const args = new SaltArgs(0n)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.salt).toBe(0n)
  })

  it('should handle max uint64 salt', () => {
    const maxUint64 = 2n ** 64n - 1n
    const args = new SaltArgs(maxUint64)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.salt).toBe(maxUint64)
  })

  it('should throw for salt greater than uint64', () => {
    const tooLarge = 2n ** 64n
    expect(() => new SaltArgs(tooLarge)).toThrow('Must be a valid uint64')
  })

  it('should throw for negative salt', () => {
    expect(() => new SaltArgs(-1n)).toThrow('Must be a valid uint64')
  })

  it('should use static decode method', () => {
    const args = new SaltArgs(9999n)
    const encoded = coder.encode(args)

    const decoded = SaltArgs.decode(encoded)
    expect(decoded.salt).toBe(9999n)
  })

  it('should convert to JSON', () => {
    const args = new SaltArgs(42n)
    const json = args.toJSON()

    expect(json).toEqual({
      salt: '42',
      bytes: '0x000000000000002a',
    })
  })

  it('should encode expected hex format', () => {
    const args = new SaltArgs(0x1234567890abcdefn)
    const encoded = coder.encode(args)

    expect(encoded.toString().toLowerCase()).toBe('0x1234567890abcdef')
  })

  it('should expose the 8-byte encoding of a bigint salt', () => {
    const args = new SaltArgs(0x1234n)

    expect(args.bytes.toString()).toBe('0x0000000000001234')
    expect(args.salt).toBe(0x1234n)
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
    expect(decoded.salt).toBe(args.salt)
  })

  it('should treat an empty salt as zero', () => {
    const args = new SaltArgs(HexString.EMPTY)

    expect(args.salt).toBe(0n)
    expect(args.bytes.isEmpty()).toBe(true)
  })

  it('should expose the numeric value of raw salt bytes', () => {
    expect(new SaltArgs(new HexString('0xdeadbeef')).salt).toBe(0xdeadbeefn)
    expect(new SaltArgs(new HexString('0x' + 'ff'.repeat(32))).salt).toBe(2n ** 256n - 1n)
  })

  it('should keep leading zero bytes of a raw salt', () => {
    const raw = new SaltArgs(new HexString('0x00000001'))
    const uint64 = new SaltArgs(1n)

    expect(raw.salt).toBe(uint64.salt)
    expect(raw.bytes.toString()).toBe('0x00000001')
    expect(uint64.bytes.toString()).toBe('0x0000000000000001')
  })

  it('should produce the same bytes for a uint64 salt and its 8-byte raw form', () => {
    const fromBigInt = new SaltArgs(0x1234567890abcdefn)
    const fromBytes = new SaltArgs(new HexString('0x1234567890abcdef'))

    expect(coder.encode(fromBytes).toString()).toBe(coder.encode(fromBigInt).toString())
    expect(fromBytes.salt).toBe(fromBigInt.salt)
  })

  it('should convert raw salt bytes to JSON', () => {
    const args = new SaltArgs(new HexString('0xdeadbeef'))

    expect(args.toJSON()).toEqual({
      salt: 0xdeadbeefn.toString(),
      bytes: '0xdeadbeef',
    })
    expect(new SaltArgs(HexString.EMPTY).toJSON()).toEqual({
      salt: '0',
      bytes: '0x',
    })
  })
})
