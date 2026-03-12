// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { DynamicProtocolFeeArgs } from './dynamic-protocol-fee-args'
import { DynamicProtocolFeeArgsCoder } from './dynamic-protocol-fee-args-coder'

const feeProvider = new Address('0x68b3165833fb72a70ecdf485e0e4c7bd8665fc45')

describe('DynamicProtocolFeeArgs', () => {
  it('should encode and decode dynamic protocol fee args', () => {
    const args = new DynamicProtocolFeeArgs(feeProvider)

    const encoded = DynamicProtocolFeeArgs.CODER.encode(args)
    expect(encoded.toString().length).toEqual(42)

    const decoded = DynamicProtocolFeeArgs.decode(encoded)
    expect(decoded.feeProvider.toString().toLowerCase()).toBe(feeProvider.toString().toLowerCase())
  })

  it('should handle different fee provider addresses', () => {
    const addresses = [
      '0x0000000000000000000000000000000000000001',
      '0xffffffffffffffffffffffffffffffffffffffff',
      '0x742d35cc6634c0532925a3b844bc9e7595f0fa1b',
      '0x1111111254fb6c44bAC0beD2854e76F90643097d',
    ]

    addresses.forEach((addr) => {
      const provider = new Address(addr)
      const args = new DynamicProtocolFeeArgs(provider)

      const encoded = DynamicProtocolFeeArgs.CODER.encode(args)
      const decoded = DynamicProtocolFeeArgs.decode(encoded)

      expect(decoded.feeProvider.toString().toLowerCase()).toBe(provider.toString().toLowerCase())
    })
  })

  it('should produce 20-byte encoding (single address)', () => {
    const args = new DynamicProtocolFeeArgs(feeProvider)
    const encoded = DynamicProtocolFeeArgs.CODER.encode(args)
    const hex = encoded.toString().replace(/^0x/, '')
    expect(hex.length).toBe(40)
  })

  it('should convert to JSON correctly', () => {
    const args = new DynamicProtocolFeeArgs(feeProvider)
    const json = args.toJSON()

    expect(json).toEqual({
      feeProvider: feeProvider.toString(),
    })
  })

  it('should round-trip through coder instance', () => {
    const coder = new DynamicProtocolFeeArgsCoder()
    const args = new DynamicProtocolFeeArgs(feeProvider)

    const encoded = coder.encode(args)
    const decoded = coder.decode(encoded)

    expect(decoded.feeProvider.toString().toLowerCase()).toBe(
      args.feeProvider.toString().toLowerCase(),
    )
  })

  it('should use static decode method', () => {
    const args = new DynamicProtocolFeeArgs(feeProvider)
    const encoded = DynamicProtocolFeeArgs.CODER.encode(args)
    const decoded = DynamicProtocolFeeArgs.decode(encoded)

    expect(decoded).toBeInstanceOf(DynamicProtocolFeeArgs)
    expect(decoded.feeProvider.toString().toLowerCase()).toBe(feeProvider.toString().toLowerCase())
  })

  const coder = new DynamicProtocolFeeArgsCoder()

  it('should encode and decode args', () => {
    const args = new DynamicProtocolFeeArgs(feeProvider)

    const encoded = coder.encode(args)
    expect(encoded).toBeInstanceOf(HexString)

    const decoded = coder.decode(encoded)
    expect(decoded.feeProvider.toString().toLowerCase()).toBe(feeProvider.toString().toLowerCase())
  })

  it('should decode from raw 20-byte hex', () => {
    const hex = new HexString(feeProvider.toString())
    const decoded = coder.decode(hex)
    expect(decoded.feeProvider.toString().toLowerCase()).toBe(feeProvider.toString().toLowerCase())
  })

  it('should not allow zero address', () => {
    const zero = new Address('0x0000000000000000000000000000000000000000')
    expect(() => new DynamicProtocolFeeArgs(zero)).toThrow()
  })
})
