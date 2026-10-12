import { describe, it, expect } from 'vitest'
import { Address } from './address'
import { HexString } from './hex-string'
import { Interaction } from './interaction'

describe('Interaction', () => {
  const target = new Address('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D')
  const data = new HexString('0xabcdef')

  it('should encode target and data and decode back', () => {
    const interaction = new Interaction(target, data)
    const encoded = interaction.encode()

    expect(encoded.toString()).toBe(`${target.toString()}abcdef`)

    const decoded = Interaction.decode(encoded)

    expect(decoded.target.equal(target)).toBe(true)
    expect(decoded.data.equal(data)).toBe(true)
    expect(decoded.equal(interaction)).toBe(true)
  })

  it('should treat different target or data as not equal', () => {
    const interaction = new Interaction(target, data)
    const otherTarget = new Interaction(Address.ZERO_ADDRESS, data)
    const otherData = new Interaction(target, new HexString('0x11'))

    expect(interaction.equal(otherTarget)).toBe(false)
    expect(interaction.equal(otherData)).toBe(false)
  })

  it('should reject invalid interaction data', () => {
    expect(() => new Interaction(target, new HexString('0xabc'))).toThrow()
  })

  it('should accept empty data', () => {
    const withTarget = new Interaction(target, HexString.EMPTY)
    const withoutTarget = new Interaction(Address.ZERO_ADDRESS, HexString.EMPTY)

    expect(withTarget.data.isEmpty()).toBe(true)
    expect(withoutTarget.data.isEmpty()).toBe(true)
    expect(withTarget.encode().toString()).toBe(target.toString())
  })

  it('should decode exactly 20 bytes as target with empty data', () => {
    const decoded = Interaction.decode(new HexString(target.toString()))

    expect(decoded.target.equal(target)).toBe(true)
    expect(decoded.data.isEmpty()).toBe(true)
    expect(decoded.equal(new Interaction(target, HexString.EMPTY))).toBe(true)
  })

  it('should round-trip an interaction with empty data', () => {
    const interaction = new Interaction(target, HexString.EMPTY)
    const encoded = interaction.encode()

    expect(encoded.bytesCount()).toBe(20)

    const decoded = Interaction.decode(encoded)

    expect(decoded.equal(interaction)).toBe(true)
    expect(decoded.encode().equal(encoded)).toBe(true)
  })
})
