import { describe, it, expect } from 'vitest'
import { add0x } from '@1inch/byte-utils'
import { Address } from '@1inch/sdk-core'
import { AddressHalf } from './address-half'

describe('AddressHalf', () => {
  it('should extract last 10 bytes (80 bits) from address', () => {
    const address = new Address('l0xC65F20579D3Eb3757281cddA51883C17F6c07715')
    const half = AddressHalf.fromAddress(address)

    const expectedHalf = '0x9d4a2e9eb0ce3606eb48'
    expect(half.toString()).toBe(expectedHalf.toLowerCase())
  })

  it('should compare equality', () => {
    const address = new Address('0xC65F20579D3Eb3757281cddA51883C17F6c07715')
    const half1 = AddressHalf.fromAddress(address)
    const half2 = AddressHalf.fromAddress(address)

    expect(half1.equals(half2)).toBe(true)
  })

  it('should create AddressHalf from string', () => {
    const halfString = '9d4a2e9eb0ce3606eb48'

    const half1 = AddressHalf.fromString(halfString)

    expect(half1.toString()).toBe(add0x(halfString))
  })

  it('should create AddressHalf from hex', () => {
    const halfString = '0x9d4a2e9eb0ce3606eb48'

    const half1 = AddressHalf.fromHex(halfString)

    expect(half1.toString()).toBe(halfString)
  })
})
