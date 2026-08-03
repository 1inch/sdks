import { describe, it, expect } from 'vitest'
import { Address } from './address'
import { HexString } from './hex-string'
import { Interaction } from './interaction'

describe('Interaction', () => {
  const target = new Address('0xC65F20579D3Eb3757281cddA51883C17F6c07715')
  const data = new HexString('0xdeadbeef')

  describe('constructor', () => {
    it('should expose target and data', () => {
      const interaction = new Interaction(target, data)

      expect(interaction.target.toString()).toBe(target.toString())
      expect(interaction.data.toString()).toBe('0xdeadbeef')
    })

    it('should reject empty data', () => {
      // `isHexBytes('0x')` is false, so an interaction carrying no calldata
      // cannot be constructed at all.
      expect(() => new Interaction(target, HexString.EMPTY)).toThrow()
    })
  })

  describe('encode', () => {
    it('should place the 20-byte target first, then the data', () => {
      const encoded = new Interaction(target, data).encode()

      expect(encoded.toString()).toBe(`${target.toString()}deadbeef`)
      expect(encoded.bytesCount()).toBe(24)
    })

    it('should keep single-byte data intact', () => {
      const encoded = new Interaction(target, new HexString('0x01')).encode()

      expect(encoded.toString()).toBe(`${target.toString()}01`)
      expect(encoded.bytesCount()).toBe(21)
    })
  })

  describe('decode', () => {
    it('should split the first 20 bytes into the target and keep the rest as data', () => {
      const decoded = Interaction.decode(new HexString(`${target.toString()}deadbeef`))

      expect(decoded.target.toString()).toBe(target.toString())
      expect(decoded.data.toString()).toBe('0xdeadbeef')
    })

    it('should throw when nothing follows the 20-byte target', () => {
      // Decoding a bare address leaves no data, which the constructor rejects.
      expect(() => Interaction.decode(new HexString(target.toString()))).toThrow()
    })

    it('should round-trip through encode', () => {
      const original = new Interaction(target, data)
      const roundTripped = Interaction.decode(original.encode())

      expect(roundTripped.equal(original)).toBe(true)
    })
  })

  describe('equal', () => {
    it('should be true for the same target and data', () => {
      expect(new Interaction(target, data).equal(new Interaction(target, data))).toBe(true)
    })

    it('should be false when the data differs', () => {
      const other = new Interaction(target, new HexString('0xdeadbeef00'))

      expect(new Interaction(target, data).equal(other)).toBe(false)
    })

    it('should be false when the target differs', () => {
      const other = new Interaction(Address.ZERO_ADDRESS, data)

      expect(new Interaction(target, data).equal(other)).toBe(false)
    })
  })
})
