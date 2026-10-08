// SPDX-License-Identifier: LicenseRef-Degensoft-SwapVM-1.1

import { describe, it, expect } from 'vitest'
import { Address, HexString } from '@1inch/sdk-core'
import { ProtocolFeeArgs } from './protocol-fee-args'

describe('ProtocolFeeArgs', () => {
  const feeRecipient = new Address('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45')

  it('should encode and decode protocol fee args', () => {
    const fee = 10000000n
    const args = new ProtocolFeeArgs(fee, feeRecipient)

    const encoded = ProtocolFeeArgs.CODER.encode(args)
    expect(encoded.toString()).toBe('0x0098968068b3465833fb72a70ecdf485e0e4c7bd8665fc45')

    const decoded = ProtocolFeeArgs.decode(encoded)
    expect(decoded.fee).toBe(fee)
    expect(decoded.to.toString()).toBe(feeRecipient.toString())
  })

  it('should handle maximum fee with different addresses', () => {
    const maxFee = 999999999n
    const addresses = [
      '0x0000000000000000000000000000000000000001',
      '0xffffffffffffffffffffffffffffffffffffffff',
      '0x742d35cc6634c0532925a3b844bc9e7595f0fa1b',
    ]

    addresses.forEach((addr) => {
      const recipient = new Address(addr)
      const args = new ProtocolFeeArgs(maxFee, recipient)

      const encoded = ProtocolFeeArgs.CODER.encode(args)
      const decoded = ProtocolFeeArgs.decode(encoded)

      expect(decoded.fee).toBe(maxFee)
      expect(decoded.to.toString()).toBe(recipient.toString())
    })
  })

  it('should handle minimum fee (0%)', () => {
    const minFee = 0n
    const args = new ProtocolFeeArgs(minFee, feeRecipient)

    const encoded = ProtocolFeeArgs.CODER.encode(args)
    const decoded = ProtocolFeeArgs.decode(encoded)

    expect(decoded.fee).toBe(minFee)
    expect(decoded.to.toString()).toBe(feeRecipient.toString())
  })

  it('should convert to JSON correctly', () => {
    const args = new ProtocolFeeArgs(5000000n, feeRecipient)
    const json = args.toJSON()

    expect(json).toEqual({
      fee: '5000000',
      to: feeRecipient.toString(),
    })
  })

  it('should throw on invalid values', () => {
    const maxUint32 = (1n << 32n) - 1n
    const FEE_100_PERCENT = 1000000000n

    expect(() => new ProtocolFeeArgs(-1n, feeRecipient)).toThrow()

    expect(() => new ProtocolFeeArgs(maxUint32 + 1n, feeRecipient)).toThrow()

    expect(() => new ProtocolFeeArgs(FEE_100_PERCENT, feeRecipient)).toThrow('Fee out of range')
    expect(() => new ProtocolFeeArgs(FEE_100_PERCENT + 1n, feeRecipient)).toThrow(
      'Fee out of range',
    )
  })

  it('should reject a zero fee recipient when the fee is non zero', () => {
    expect(() => new ProtocolFeeArgs(1n, Address.ZERO_ADDRESS)).toThrow(
      'Invalid fee recipient (to). Must be non zero address when fee > 0',
    )
    expect(() => new ProtocolFeeArgs(1000000n, Address.ZERO_ADDRESS)).toThrow(
      'Invalid fee recipient (to). Must be non zero address when fee > 0',
    )
    expect(() => ProtocolFeeArgs.fromBps(10, Address.ZERO_ADDRESS)).toThrow(
      'Invalid fee recipient (to). Must be non zero address when fee > 0',
    )
  })

  it('should accept a zero fee recipient when the fee is zero', () => {
    const args = new ProtocolFeeArgs(0n, Address.ZERO_ADDRESS)

    const encoded = ProtocolFeeArgs.CODER.encode(args)
    expect(encoded.toString()).toBe('0x00000000' + '00'.repeat(20))

    const decoded = ProtocolFeeArgs.decode(encoded)
    expect(decoded.fee).toBe(0n)
    expect(decoded.to.isZero()).toBe(true)

    expect(ProtocolFeeArgs.fromBps(0, Address.ZERO_ADDRESS).fee).toBe(0n)
  })

  it('should reject a 100% fee or a zero recipient for a non zero fee when decoding', () => {
    const fullFee = new HexString('0x3b9aca00' + '68b3465833fb72a70ecdf485e0e4c7bd8665fc45')
    const zeroRecipient = new HexString('0x00989680' + '00'.repeat(20))

    expect(() => ProtocolFeeArgs.decode(fullFee)).toThrow(
      'Fee out of range: 1000000000. Must be < 1000000000',
    )
    expect(() => ProtocolFeeArgs.decode(zeroRecipient)).toThrow(
      'Invalid fee recipient (to). Must be non zero address when fee > 0',
    )
  })

  it('should handle common protocol fee scenarios', () => {
    const testCases = [
      {
        desc: 'DEX fee',
        fee: 2500000n,
        recipient: '0x1111111254fb6c44bAC0beD2854e76F90643097d',
      },
      {
        desc: 'Treasury fee',
        fee: 5000000n,
        recipient: '0xE37e799D5077682FA0a244D46E5649F71457BD09',
      },
      {
        desc: 'Staking rewards',
        fee: 1000000n,
        recipient: '0x3333333333333333333333333333333333333333',
      },
    ]

    testCases.forEach(({ fee, recipient }) => {
      const to = new Address(recipient)
      const args = new ProtocolFeeArgs(fee, to)
      const encoded = ProtocolFeeArgs.CODER.encode(args)
      const decoded = ProtocolFeeArgs.decode(encoded)

      expect(decoded.fee).toBe(fee)
      expect(decoded.to.toString().toLowerCase()).toBe(recipient.toLowerCase())
    })
  })

  it('should enforce fee limit (below 100%)', () => {
    const FEE_100_PERCENT = 1000000000n

    expect(() => new ProtocolFeeArgs(FEE_100_PERCENT - 1n, feeRecipient)).not.toThrow()

    expect(() => new ProtocolFeeArgs(FEE_100_PERCENT, feeRecipient)).toThrow(
      'Fee out of range: 1000000000. Must be < 1000000000',
    )
    expect(() => new ProtocolFeeArgs(FEE_100_PERCENT + 1n, feeRecipient)).toThrow()
    expect(() => new ProtocolFeeArgs(2n * FEE_100_PERCENT, feeRecipient)).toThrow()
  })

  it('should preserve address case in encoding/decoding', () => {
    const mixedCaseAddress = new Address('0xabcdef1234567890123456789012345678901234')
    const args = new ProtocolFeeArgs(1000000n, mixedCaseAddress)

    const encoded = ProtocolFeeArgs.CODER.encode(args)
    const decoded = ProtocolFeeArgs.decode(encoded)

    expect(decoded.to.toString().toLowerCase()).toBe(mixedCaseAddress.toString().toLowerCase())
  })

  it('should create from basis points correctly', () => {
    const testCases = [
      { bps: 0, expectedFee: 0n },
      { bps: 10, expectedFee: 1000000n },
      { bps: 100, expectedFee: 10000000n },
      { bps: 250, expectedFee: 25000000n },
      { bps: 1000, expectedFee: 100000000n },
    ]

    testCases.forEach(({ bps, expectedFee }) => {
      const args = ProtocolFeeArgs.fromBps(bps, feeRecipient)
      expect(args).toBeInstanceOf(ProtocolFeeArgs)
      expect(args.fee).toBe(expectedFee)
      expect(args.to).toBe(feeRecipient)

      const encoded = ProtocolFeeArgs.CODER.encode(args)
      const decoded = ProtocolFeeArgs.decode(encoded)
      expect(decoded.fee).toBe(expectedFee)
      expect(decoded.to.toString()).toBe(feeRecipient.toString())
    })

    expect(() => ProtocolFeeArgs.fromBps(10000, feeRecipient)).toThrow('Fee out of range')
  })

  it('should create from percent correctly and be consistent with fromBps', () => {
    const testCases = [
      { percent: 0.1, expectedFee: 1000000n },
      { percent: 1, expectedFee: 10000000n },
      { percent: 2.5, expectedFee: 25000000n },
      { percent: 10, expectedFee: 100000000n },
    ]

    testCases.forEach(({ percent, expectedFee }) => {
      const args = ProtocolFeeArgs.fromPercent(percent, feeRecipient)
      expect(args).toBeInstanceOf(ProtocolFeeArgs)
      expect(args.fee).toBe(expectedFee)
      expect(args.to).toBe(feeRecipient)
    })

    const percent1 = ProtocolFeeArgs.fromPercent(1, feeRecipient)
    const bps100 = ProtocolFeeArgs.fromBps(100, feeRecipient)
    expect(percent1.fee).toBe(bps100.fee)
    expect(percent1.to).toBe(bps100.to)
  })
})
